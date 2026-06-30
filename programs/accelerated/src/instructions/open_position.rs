//! Open a leveraged position. The trader posts USDC collateral and chooses a direction and
//! leverage; the program prices against the oracle, charges the taker fee, enforces the market's
//! tier/OI/position caps, reserves vault liquidity, and writes the `Position` PDA.

use crate::constants::*;
use crate::errors::AcceleratedError;
use crate::state::{Market, Position, Protocol, Vault};
use crate::utils::margin::entry_leverage_bps;
use crate::utils::math::{apply_bps, base_from_notional, notional, to_u64, SafeMath};
use crate::utils::oracle::read_price;
use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct OpenParams {
    pub is_long: bool,
    /// Collateral to post, in USDC base units.
    pub collateral: u64,
    /// Requested leverage in bps (e.g. 50_000 = 5x). Clamped to the market tier cap.
    pub leverage_bps: u64,
    /// Max acceptable entry price (long) / min acceptable (short), slippage guard.
    pub price_limit: u128,
}

#[derive(Accounts)]
pub struct OpenPosition<'info> {
    #[account(mut)]
    pub trader: Signer<'info>,

    #[account(seeds = [PROTOCOL_SEED], bump = protocol.bump)]
    pub protocol: Account<'info, Protocol>,

    #[account(mut, seeds = [MARKET_SEED, market.mint.as_ref()], bump = market.bump)]
    pub market: Account<'info, Market>,

    /// CHECK: validated by the oracle adapter against `market.oracle`.
    #[account(address = market.oracle)]
    pub oracle: UncheckedAccount<'info>,

    #[account(mut, seeds = [VAULT_SEED], bump = vault.bump)]
    pub vault: Account<'info, Vault>,

    #[account(mut, address = vault.collateral_account)]
    pub vault_collateral: Account<'info, TokenAccount>,

    #[account(
        init,
        payer = trader,
        space = 8 + Position::INIT_SPACE,
        seeds = [POSITION_SEED, market.key().as_ref(), trader.key().as_ref()],
        bump
    )]
    pub position: Account<'info, Position>,

    #[account(
        mut,
        constraint = trader_usdc.mint == vault.collateral_mint @ AcceleratedError::MintMismatch
    )]
    pub trader_usdc: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<OpenPosition>, params: OpenParams) -> Result<()> {
    require!(!ctx.accounts.protocol.paused, AcceleratedError::ProtocolPaused);
    require!(!ctx.accounts.market.paused, AcceleratedError::MarketPaused);
    require!(params.collateral >= MIN_COLLATERAL, AcceleratedError::CollateralTooLow);

    let now = Clock::get()?.unix_timestamp;
    let market = &mut ctx.accounts.market;
    market.check_leverage(params.leverage_bps)?;

    // --- price ---
    let obs = read_price(
        &ctx.accounts.oracle.to_account_info(),
        market.oracle_expo,
        market.max_confidence_bps,
        now,
    )?;
    let entry_price = obs.conservative(params.is_long, true)?;
    if params.is_long {
        require!(entry_price <= params.price_limit, AcceleratedError::OracleConfidenceTooWide);
    } else {
        require!(entry_price >= params.price_limit, AcceleratedError::OracleConfidenceTooWide);
    }

    // --- fee & sizing ---
    // notional = collateral * leverage; size = notional / price
    let target_notional = (params.collateral as u128)
        .safe_mul(params.leverage_bps as u128)?
        .safe_div(BPS_DENOMINATOR as u128)?;
    let fee = apply_bps(target_notional, market.taker_fee_bps)?;
    let fee_u64 = to_u64(fee)?;
    let collateral_after_fee = params.collateral.safe_sub(fee_u64)?;

    // recompute notional net of fee so leverage reflects working collateral
    let net_notional = (collateral_after_fee as u128)
        .safe_mul(params.leverage_bps as u128)?
        .safe_div(BPS_DENOMINATOR as u128)?;
    let base_size = base_from_notional(net_notional, entry_price)?;
    let entry_notional = to_u64(notional(base_size, entry_price)?)?;

    require!(entry_notional <= market.max_position, AcceleratedError::PositionTooLarge);

    let real_leverage = entry_leverage_bps(net_notional, collateral_after_fee)?;
    market.check_leverage(real_leverage)?;

    // --- open-interest caps ---
    if params.is_long {
        let new_oi = market.long_oi.safe_add(base_size)?;
        let new_oi_notional = to_u64(notional(new_oi, entry_price)?)?;
        require!(new_oi_notional <= market.max_oi_per_side, AcceleratedError::OpenInterestCapBreached);
        market.long_oi = new_oi;
    } else {
        let new_oi = market.short_oi.safe_add(base_size)?;
        let new_oi_notional = to_u64(notional(new_oi, entry_price)?)?;
        require!(new_oi_notional <= market.max_oi_per_side, AcceleratedError::OpenInterestCapBreached);
        market.short_oi = new_oi;
    }

    // --- vault: collateral in, reserve backing, collect fee ---
    token::transfer(
        CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.trader_usdc.to_account_info(),
                to: ctx.accounts.vault_collateral.to_account_info(),
                authority: ctx.accounts.trader.to_account_info(),
            },
        ),
        params.collateral,
    )?;

    let vault = &mut ctx.accounts.vault;
    vault.reserve(collateral_after_fee)?;
    vault.credit(fee_u64)?; // taker fee accrues to LPs

    // --- write position ---
    let funding_snapshot = if params.is_long {
        market.cumulative_funding_long
    } else {
        market.cumulative_funding_short
    };

    let position = &mut ctx.accounts.position;
    position.owner = ctx.accounts.trader.key();
    position.market = market.key();
    position.is_long = params.is_long;
    position.base_size = base_size;
    position.collateral = collateral_after_fee;
    position.entry_price = entry_price;
    position.funding_snapshot = funding_snapshot;
    position.entry_notional = entry_notional;
    position.opened_at = now;
    position.last_updated = now;
    position.bump = ctx.bumps.position;

    msg!(
        "OPEN {} · {} · size {} · entry {} · lev {}bps · fee {}",
        if params.is_long { "LONG" } else { "SHORT" },
        market.mint,
        base_size,
        entry_price,
        real_leverage,
        fee_u64
    );
    Ok(())
}
