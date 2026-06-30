//! LPs deposit USDC into the shared vault and receive vault shares (ALP).

use crate::constants::*;
use crate::errors::AcceleratedError;
use crate::state::Vault;
use crate::utils::math::SafeMath;
use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, MintTo, Token, TokenAccount, Transfer};

#[derive(Accounts)]
pub struct DepositLiquidity<'info> {
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

    #[account(
        mut,
        constraint = lp_usdc.mint == vault.collateral_mint @ AcceleratedError::MintMismatch
    )]
    pub lp_usdc: Account<'info, TokenAccount>,

    #[account(mut, constraint = lp_shares.mint == vault.lp_mint @ AcceleratedError::MintMismatch)]
    pub lp_shares: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

pub fn handler(ctx: Context<DepositLiquidity>, amount: u64) -> Result<()> {
    require!(amount > 0, AcceleratedError::CollateralTooLow);

    let shares = ctx.accounts.vault.shares_for_deposit(amount)?;

    // pull USDC from the LP into the vault
    token::transfer(
        CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.lp_usdc.to_account_info(),
                to: ctx.accounts.vault_collateral.to_account_info(),
                authority: ctx.accounts.lp.to_account_info(),
            },
        ),
        amount,
    )?;

    // mint LP shares to the depositor
    let seeds: &[&[u8]] = &[VAULT_AUTHORITY_SEED, &[ctx.accounts.vault.authority_bump]];
    token::mint_to(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            MintTo {
                mint: ctx.accounts.lp_mint.to_account_info(),
                to: ctx.accounts.lp_shares.to_account_info(),
                authority: ctx.accounts.vault_authority.to_account_info(),
            },
            &[seeds],
        ),
        shares,
    )?;

    let vault = &mut ctx.accounts.vault;
    vault.total_assets = vault.total_assets.safe_add(amount)?;
    vault.total_shares = vault.total_shares.safe_add(shares)?;

    msg!("LP deposit {} USDC -> {} shares", amount, shares);
    Ok(())
}
