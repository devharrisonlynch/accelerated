//! Close a position: settle accrued funding and realized PnL against the vault, release the
//! reserved backing, return the trader's remaining equity, and close the PDA (rent refunded).

use crate::constants::*;
use crate::errors::AcceleratedError;
use crate::state::{Market, Position, Vault};
use crate::utils::math::{notional, to_u64, unrealized_pnl, SafeMath};
use crate::utils::oracle::read_price;
use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

#[derive(Accounts)]
pub struct ClosePosition<'info> {
    #[account(mut)]
    pub trader: Signer<'info>,

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
        close = trader,
        seeds = [POSITION_SEED, market.key().as_ref(), trader.key().as_ref()],
        bump = position.bump,
        has_one = owner @ AcceleratedError::Unauthorized,
        constraint = position.owner == trader.key() @ AcceleratedError::Unauthorized
    )]
    pub position: Account<'info, Position>,

    #[account(mut, constraint = trader_usdc.mint == vault.collateral_mint @ AcceleratedError::MintMismatch)]
    pub trader_usdc: Account<'info, TokenAccount>,

    /// CHECK: matched against position.owner via has_one.
    #[account(address = position.owner)]
    pub owner: UncheckedAccount<'info>,

    pub token_program: Program<'info, Token>,
}

pub fn handler(ctx: Context<ClosePosition>) -> Result<()> {
    let now = Clock::get()?.unix_timestamp;
    let market = &mut ctx.accounts.market;
    let position = &ctx.accounts.position;

    let obs = read_price(
        &ctx.accounts.oracle.to_account_info(),
        market.oracle_expo,
        market.max_confidence_bps,
        now,
    )?;
    // mark against the side that hurts the trader on exit (close = !opening)
    let mark = obs.conservative(position.is_long, false)?;

    // funding owed since snapshot (1e9 fixed-point cumulative * size)
    let cumulative = if position.is_long {
        market.cumulative_funding_long
    } else {
        market.cumulative_funding_short
    };
    let funding_delta = cumulative.safe_sub(position.funding_snapshot)?;
    let funding_owed = funding_delta
        .safe_mul(position.base_size as i128)?
        .safe_div(FUNDING_PRECISION as i128)?;

    let pnl = unrealized_pnl(position.base_size, position.entry_price, mark, position.is_long)?;

    // equity = collateral + pnl - funding
    let equity_signed = (position.collateral as i128).safe_add(pnl)?.safe_sub(funding_owed)?;
    let payout = if equity_signed < 0 { 0u64 } else { to_u64(equity_signed as u128)? };

    // release reserved backing
    let vault = &mut ctx.accounts.vault;
    vault.release(position.collateral);

    // settle PnL with the vault: profit is debited from the vault, loss credited to it
    if equity_signed > position.collateral as i128 {
        let profit = to_u64((equity_signed - position.collateral as i128) as u128)?;
        vault.debit(profit)?;
    } else {
        let loss = position.collateral.safe_sub(payout)?;
        vault.credit(loss)?;
    }

    // update OI
    if position.is_long {
        market.long_oi = market.long_oi.saturating_sub(position.base_size);
    } else {
        market.short_oi = market.short_oi.saturating_sub(position.base_size);
    }

    // pay the trader their equity
    if payout > 0 {
        let seeds: &[&[u8]] = &[VAULT_AUTHORITY_SEED, &[vault.authority_bump]];
        token::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.vault_collateral.to_account_info(),
                    to: ctx.accounts.trader_usdc.to_account_info(),
                    authority: ctx.accounts.vault_authority.to_account_info(),
                },
                &[seeds],
            ),
            payout,
        )?;
    }

    msg!(
        "CLOSE {} · pnl {} · funding {} · payout {} (notional {})",
        market.mint,
        pnl,
        funding_owed,
        payout,
        to_u64(notional(position.base_size, mark)?)?
    );
    Ok(())
}
