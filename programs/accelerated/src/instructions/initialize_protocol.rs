//! Bootstraps the global protocol config and the shared ALP vault.

use crate::constants::*;
use crate::state::{Protocol, Vault};
use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token, TokenAccount};

#[derive(Accounts)]
pub struct InitializeProtocol<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        init,
        payer = authority,
        space = 8 + Protocol::INIT_SPACE,
        seeds = [PROTOCOL_SEED],
        bump
    )]
    pub protocol: Account<'info, Protocol>,

    #[account(
        init,
        payer = authority,
        space = 8 + Vault::INIT_SPACE,
        seeds = [VAULT_SEED],
        bump
    )]
    pub vault: Account<'info, Vault>,

    /// CHECK: PDA that owns the vault's token account and signs payouts.
    #[account(seeds = [VAULT_AUTHORITY_SEED], bump)]
    pub vault_authority: UncheckedAccount<'info>,

    pub collateral_mint: Account<'info, Mint>,

    #[account(
        init,
        payer = authority,
        token::mint = collateral_mint,
        token::authority = vault_authority,
        seeds = [VAULT_SEED, b"collateral"],
        bump
    )]
    pub vault_collateral: Account<'info, TokenAccount>,

    #[account(
        init,
        payer = authority,
        mint::decimals = 6,
        mint::authority = vault_authority,
        seeds = [LP_MINT_SEED],
        bump
    )]
    pub lp_mint: Account<'info, Mint>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

pub fn handler(ctx: Context<InitializeProtocol>, taker_fee_bps: u64) -> Result<()> {
    let protocol = &mut ctx.accounts.protocol;
    protocol.authority = ctx.accounts.authority.key();
    protocol.pending_authority = Pubkey::default();
    protocol.collateral_mint = ctx.accounts.collateral_mint.key();
    protocol.vault = ctx.accounts.vault.key();
    protocol.market_count = 0;
    protocol.paused = false;
    protocol.taker_fee_bps = taker_fee_bps;
    protocol.bump = ctx.bumps.protocol;

    let vault = &mut ctx.accounts.vault;
    vault.collateral_mint = ctx.accounts.collateral_mint.key();
    vault.collateral_account = ctx.accounts.vault_collateral.key();
    vault.lp_mint = ctx.accounts.lp_mint.key();
    vault.total_assets = 0;
    vault.total_shares = 0;
    vault.reserved = 0;
    vault.insurance_fund = 0;
    vault.max_utilization_bps = 8_000; // 80%
    vault.authority_bump = ctx.bumps.vault_authority;
    vault.bump = ctx.bumps.vault;

    msg!("Accelerated protocol initialized · fee {} bps", taker_fee_bps);
    Ok(())
}
