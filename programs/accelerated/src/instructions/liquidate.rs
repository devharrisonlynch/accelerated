//! Permissionless liquidation. When a position's margin ratio falls to or below the market's
//! maintenance requirement, any keeper may close it. The keeper earns a bounty in bps of notional;
//! the insurance fund takes a cut; the remaining equity (if any) is returned to the position owner.

use crate::constants::*;
use crate::errors::AcceleratedError;
use crate::state::{Market, Position, Vault};
use crate::utils::margin::{is_liquidatable, margin_ratio_bps};
use crate::utils::math::{apply_bps, notional, to_u64, unrealized_pnl, SafeMath};
use crate::utils::oracle::read_price;
use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

#[derive(Accounts)]
pub struct Liquidate<'info> {
    /// Any keeper may call this.
    #[account(mut)]
    pub keeper: Signer<'info>,

    #[account(mut, seeds = [MARKET_SEED, market.mint.as_ref()], bump = market.bump)]
    pub market: Account<'info, Market>,

    /// CHECK: validated by the oracle adapter against `market.oracle`.
    #[account(address = market.oracle)]
    pub oracle: UncheckedAccount<'info>,

    #[account(mut, seeds = [VAULT_SEED], bump = vault.bump)]
    pub vault: Account<'info, Vault>,

    /// CHECK: vault authority PDA.
    #[account(seeds = [VAULT_AUTHORITY_SEED], bump = vault.authority_bump)]
    pub vault_authority: UncheckedAccount<'info>,

    #[account(mut, address = vault.collateral_account)]
    pub vault_collateral: Account<'info, TokenAccount>,

    #[account(
        mut,
        close = position_owner,
        seeds = [POSITION_SEED, market.key().as_ref(), position.owner.as_ref()],
        bump = position.bump
    )]
    pub position: Account<'info, Position>,

    /// CHECK: rent + residual equity recipient; matched to position.owner.
    #[account(mut, address = position.owner)]
    pub position_owner: UncheckedAccount<'info>,

    #[account(mut, constraint = owner_usdc.mint == vault.collateral_mint @ AcceleratedError::MintMismatch)]
    pub owner_usdc: Account<'info, TokenAccount>,

    #[account(mut, constraint = keeper_usdc.mint == vault.collateral_mint @ AcceleratedError::MintMismatch)]
    pub keeper_usdc: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

pub fn handler(ctx: Context<Liquidate>) -> Result<()> {
    let now = Clock::get()?.unix_timestamp;
    let market = &mut ctx.accounts.market;
    let position = &ctx.accounts.position;

    let obs = read_price(
        &ctx.accounts.oracle.to_account_info(),
        market.oracle_expo,
        market.max_confidence_bps,
        now,
    )?;
    let mark = obs.price; // liquidations use the mid price; the penalty covers slippage

    // funding owed
    let cumulative = if position.is_long {
        market.cumulative_funding_long
    } else {
        market.cumulative_funding_short
    };
    let funding_owed = cumulative
        .safe_sub(position.funding_snapshot)?
        .safe_mul(position.base_size as i128)?
        .safe_div(FUNDING_PRECISION as i128)?;

    // verify the position is actually underwater
    let mr = margin_ratio_bps(
        position.collateral,
        position.base_size,
        position.entry_price,
        mark,
        position.is_long,
        funding_owed,
    )?;
    require!(
        is_liquidatable(mr, market.tier.maintenance_margin_bps()),
        AcceleratedError::PositionHealthy
    );

    let notional_now = notional(position.base_size, mark)?;
    let pnl = unrealized_pnl(position.base_size, position.entry_price, mark, position.is_long)?;
    let equity_signed = (position.collateral as i128).safe_add(pnl)?.safe_sub(funding_owed)?;
    let equity = if equity_signed < 0 { 0u64 } else { to_u64(equity_signed as u128)? };

    // penalties
    let keeper_bounty = to_u64(apply_bps(notional_now, LIQUIDATION_FEE_BPS)?)?.min(equity);
    let insurance_cut = to_u64(apply_bps(notional_now, INSURANCE_FEE_BPS)?)?.min(equity.saturating_sub(keeper_bounty));
    let residual = equity.saturating_sub(keeper_bounty).saturating_sub(insurance_cut);

    // vault accounting: the trader's loss (collateral - equity) is the vault's gain; the vault then
    // pays out the keeper bounty and routes the insurance cut.
    let vault = &mut ctx.accounts.vault;
    vault.release(position.collateral);
    let trader_loss = position.collateral.saturating_sub(equity);
    vault.credit(trader_loss)?;
    vault.insurance_fund = vault.insurance_fund.safe_add(insurance_cut)?;

    let seeds: &[&[u8]] = &[VAULT_AUTHORITY_SEED, &[vault.authority_bump]];

    if keeper_bounty > 0 {
        vault.debit(keeper_bounty)?;
        token::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.vault_collateral.to_account_info(),
                    to: ctx.accounts.keeper_usdc.to_account_info(),
                    authority: ctx.accounts.vault_authority.to_account_info(),
                },
                &[seeds],
            ),
            keeper_bounty,
        )?;
    }

    if residual > 0 {
        vault.debit(residual)?;
        token::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.vault_collateral.to_account_info(),
                    to: ctx.accounts.owner_usdc.to_account_info(),
                    authority: ctx.accounts.vault_authority.to_account_info(),
                },
                &[seeds],
            ),
            residual,
        )?;
    }

    if position.is_long {
        market.long_oi = market.long_oi.saturating_sub(position.base_size);
    } else {
        market.short_oi = market.short_oi.saturating_sub(position.base_size);
    }

    msg!(
        "LIQUIDATE {} · mr {}bps <= mm {}bps · bounty {} · insurance {} · residual {}",
        position.owner,
        mr,
        market.tier.maintenance_margin_bps(),
        keeper_bounty,
        insurance_cut,
        residual
    );
    Ok(())
}
