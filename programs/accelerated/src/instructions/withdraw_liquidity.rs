//! LPs burn vault shares to redeem USDC. Withdrawals are blocked if they would push vault
//! utilization above the safe ceiling, protecting open positions' collateral backing.

use crate::constants::*;
use crate::errors::AcceleratedError;
use crate::state::Vault;
use crate::utils::math::SafeMath;
use anchor_lang::prelude::*;
use anchor_spl::token::{self, Burn, Mint, Token, TokenAccount, Transfer};

#[derive(Accounts)]
pub struct WithdrawLiquidity<'info> {
    #[account(mut)]
    pub lp: Signer<'info>,

    #[account(mut, seeds = [VAULT_SEED], bump = vault.bump)]
    pub vault: Account<'info, Vault>,

    /// CHECK: vault authority PDA.
    #[account(seeds = [VAULT_AUTHORITY_SEED], bump = vault.authority_bump)]
    pub vault_authority: UncheckedAccount<'info>,

    #[account(mut, address = vault.collateral_account)]
    pub vault_collateral: Account<'info, TokenAccount>,

    #[account(mut, address = vault.lp_mint)]
    pub lp_mint: Account<'info, Mint>,

    #[account(mut, constraint = lp_usdc.mint == vault.collateral_mint @ AcceleratedError::MintMismatch)]
    pub lp_usdc: Account<'info, TokenAccount>,

    #[account(mut, constraint = lp_shares.mint == vault.lp_mint @ AcceleratedError::MintMismatch)]
    pub lp_shares: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

pub fn handler(ctx: Context<WithdrawLiquidity>, shares: u64) -> Result<()> {
    require!(shares > 0, AcceleratedError::ConversionError);

    let amount = ctx.accounts.vault.assets_for_shares(shares)?;
    require!(amount <= ctx.accounts.vault.free_liquidity(), AcceleratedError::InsufficientVaultLiquidity);

    // simulate post-withdrawal utilization
    let post_assets = ctx.accounts.vault.total_assets.safe_sub(amount)?;
    let post_util = if post_assets == 0 {
        BPS_DENOMINATOR
    } else {
        ((ctx.accounts.vault.reserved as u128 * BPS_DENOMINATOR as u128) / post_assets as u128) as u64
    };
    require!(
        post_util <= ctx.accounts.vault.max_utilization_bps,
        AcceleratedError::VaultUtilizationTooHigh
    );

    // burn shares
    token::burn(
        CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Burn {
                mint: ctx.accounts.lp_mint.to_account_info(),
                from: ctx.accounts.lp_shares.to_account_info(),
                authority: ctx.accounts.lp.to_account_info(),
            },
        ),
        shares,
    )?;

    // pay out USDC
    let seeds: &[&[u8]] = &[VAULT_AUTHORITY_SEED, &[ctx.accounts.vault.authority_bump]];
    token::transfer(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.vault_collateral.to_account_info(),
                to: ctx.accounts.lp_usdc.to_account_info(),
                authority: ctx.accounts.vault_authority.to_account_info(),
            },
            &[seeds],
        ),
        amount,
    )?;

    let vault = &mut ctx.accounts.vault;
    vault.total_assets = vault.total_assets.safe_sub(amount)?;
    vault.total_shares = vault.total_shares.safe_sub(shares)?;

    msg!("LP withdraw {} shares -> {} USDC", shares, amount);
    Ok(())
}
