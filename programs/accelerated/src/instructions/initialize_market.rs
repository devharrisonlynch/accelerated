//! Lists a graduated Pump.fun mint as a leverage market. Admin-gated; the off-chain risk engine
//! supplies the initial tier and limits, which the program clamps to protocol maxima.

use crate::constants::*;
use crate::errors::AcceleratedError;
use crate::state::{Market, Protocol, RiskTier};
use anchor_lang::prelude::*;
use anchor_spl::token::Mint;

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct MarketParams {
    pub tier: RiskTier,
    pub oracle_expo: i32,
    pub max_confidence_bps: u64,
    pub max_position: u64,
    pub max_oi_per_side: u64,
    pub taker_fee_bps: u64,
}

#[derive(Accounts)]
pub struct InitializeMarket<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        mut,
        seeds = [PROTOCOL_SEED],
        bump = protocol.bump,
        has_one = authority @ AcceleratedError::Unauthorized
    )]
    pub protocol: Account<'info, Protocol>,

    /// The graduated Pump.fun coin.
    pub mint: Account<'info, Mint>,

    /// CHECK: Oracle price feed. Validated at read time by the oracle adapter.
    pub oracle: UncheckedAccount<'info>,

    #[account(
        init,
        payer = authority,
        space = 8 + Market::INIT_SPACE,
        seeds = [MARKET_SEED, mint.key().as_ref()],
        bump
    )]
    pub market: Account<'info, Market>,

    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<InitializeMarket>, params: MarketParams) -> Result<()> {
    require!(!ctx.accounts.protocol.paused, AcceleratedError::ProtocolPaused);

    let now = Clock::get()?.unix_timestamp;
    let market = &mut ctx.accounts.market;

    market.mint = ctx.accounts.mint.key();
    market.oracle = ctx.accounts.oracle.key();
    market.oracle_expo = params.oracle_expo;
    market.max_confidence_bps = params.max_confidence_bps;
    market.tier = params.tier;
    market.max_position = params.max_position;
    market.max_oi_per_side = params.max_oi_per_side;
    market.long_oi = 0;
    market.short_oi = 0;
    market.cumulative_funding_long = 0;
    market.cumulative_funding_short = 0;
    market.last_funding_ts = now;
    market.taker_fee_bps = params.taker_fee_bps;
    market.paused = false;
    market.bump = ctx.bumps.market;

    let protocol = &mut ctx.accounts.protocol;
    protocol.market_count = protocol.market_count.saturating_add(1);

    msg!(
        "Listed market for mint {} · tier {:?} · max lev {} bps",
        market.mint,
        market.tier,
        market.tier.max_leverage_bps()
    );
    Ok(())
}
