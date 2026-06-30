//! Permissionless funding crank. Once per `FUNDING_INTERVAL`, anyone can advance a market's
//! cumulative funding accumulators based on the current skew. Longs pay shorts when open interest
//! is long-heavy and vice-versa; the imbalance pulls the perp price back toward spot and the net
//! funding accrues to the vault.

use crate::constants::*;
use crate::errors::AcceleratedError;
use crate::state::Market;
use crate::utils::math::SafeMath;
use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct CrankFunding<'info> {
    pub cranker: Signer<'info>,

    #[account(mut, seeds = [MARKET_SEED, market.mint.as_ref()], bump = market.bump)]
    pub market: Account<'info, Market>,
}

pub fn handler(ctx: Context<CrankFunding>) -> Result<()> {
    let now = Clock::get()?.unix_timestamp;
    let market = &mut ctx.accounts.market;

    let elapsed = now.safe_sub(market.last_funding_ts)?;
    require!(elapsed >= FUNDING_INTERVAL, AcceleratedError::FundingNotDue);

    // hourly rate (1e9 fixed-point), prorated by elapsed intervals (caps runaway after downtime)
    let rate = market.compute_funding_rate()?;
    let intervals = (elapsed / FUNDING_INTERVAL).min(24) as i128;
    let accrued = rate.safe_mul(intervals)?;

    // longs pay when rate > 0: their cumulative grows (they owe), shorts' shrinks (they receive)
    market.cumulative_funding_long = market.cumulative_funding_long.safe_add(accrued)?;
    market.cumulative_funding_short = market.cumulative_funding_short.safe_sub(accrued)?;
    market.last_funding_ts = now;

    msg!(
        "FUNDING {} · rate {}/1e9 · intervals {} · cumL {} cumS {}",
        market.mint,
        rate,
        intervals,
        market.cumulative_funding_long,
        market.cumulative_funding_short
    );
    Ok(())
}
