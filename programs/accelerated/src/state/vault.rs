//! The shared ALP (Accelerated Liquidity Provider) vault.
//!
//! One vault underwrites *every* market. LPs deposit USDC and receive vault shares; the vault is
//! the counterparty to all traders, so it absorbs aggregate trader PnL and earns funding, taker
//! fees, and liquidation penalties. `reserved` tracks collateral locked against open positions so
//! LPs can only withdraw genuinely free liquidity.

use crate::constants::BPS_DENOMINATOR;
use crate::errors::AcceleratedError;
use crate::utils::math::SafeMath;
use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct Vault {
    /// USDC mint.
    pub collateral_mint: Pubkey,
    /// The vault's USDC token account (owned by the vault authority PDA).
    pub collateral_account: Pubkey,
    /// LP share mint.
    pub lp_mint: Pubkey,
    /// Total USDC deposited by LPs plus accrued fees (the vault's assets).
    pub total_assets: u64,
    /// Total LP shares outstanding.
    pub total_shares: u64,
    /// Collateral locked against open positions (not withdrawable by LPs).
    pub reserved: u64,
    /// Insurance fund balance, used to socialize bad debt before LPs are touched.
    pub insurance_fund: u64,
    /// Maximum utilization (reserved / assets) LPs withdrawals may not breach, in bps.
    pub max_utilization_bps: u64,
    /// Vault authority PDA bump.
    pub authority_bump: u8,
    /// Vault PDA bump.
    pub bump: u8,
    pub _reserved: [u8; 64],
}

impl Vault {
    /// Free, withdrawable liquidity = assets - reserved.
    pub fn free_liquidity(&self) -> u64 {
        self.total_assets.saturating_sub(self.reserved)
    }

    /// Current utilization in bps (reserved / assets).
    pub fn utilization_bps(&self) -> u64 {
        if self.total_assets == 0 {
            return 0;
        }
        ((self.reserved as u128 * BPS_DENOMINATOR as u128) / self.total_assets as u128) as u64
    }

    /// Convert a USDC deposit into LP shares at the current exchange rate.
    pub fn shares_for_deposit(&self, amount: u64) -> Result<u64> {
        if self.total_shares == 0 || self.total_assets == 0 {
            return Ok(amount); // bootstrap 1:1
        }
        let shares = (amount as u128)
            .safe_mul(self.total_shares as u128)?
            .safe_div(self.total_assets as u128)?;
        u64::try_from(shares).map_err(|_| error!(AcceleratedError::ConversionError))
    }

    /// Convert LP shares into the USDC they currently redeem for.
    pub fn assets_for_shares(&self, shares: u64) -> Result<u64> {
        if self.total_shares == 0 {
            return Ok(0);
        }
        let assets = (shares as u128)
            .safe_mul(self.total_assets as u128)?
            .safe_div(self.total_shares as u128)?;
        u64::try_from(assets).map_err(|_| error!(AcceleratedError::ConversionError))
    }

    /// Lock collateral against a newly opened position.
    pub fn reserve(&mut self, amount: u64) -> Result<()> {
        let new_reserved = self.reserved.safe_add(amount)?;
        require!(new_reserved <= self.total_assets, AcceleratedError::InsufficientVaultLiquidity);
        self.reserved = new_reserved;
        Ok(())
    }

    /// Release collateral when a position closes.
    pub fn release(&mut self, amount: u64) {
        self.reserved = self.reserved.saturating_sub(amount);
    }

    /// Credit realized profit/fees to the vault.
    pub fn credit(&mut self, amount: u64) -> Result<()> {
        self.total_assets = self.total_assets.safe_add(amount)?;
        Ok(())
    }

    /// Debit a trader payout from the vault, drawing on the insurance fund for any shortfall.
    pub fn debit(&mut self, amount: u64) -> Result<()> {
        if amount <= self.total_assets {
            self.total_assets = self.total_assets.safe_sub(amount)?;
        } else {
            let shortfall = amount.safe_sub(self.total_assets)?;
            self.total_assets = 0;
            self.insurance_fund = self.insurance_fund.saturating_sub(shortfall);
        }
        Ok(())
    }
}
