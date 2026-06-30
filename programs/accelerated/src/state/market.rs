//! A single perpetual market over one graduated Pump.fun mint.

use crate::constants::{BPS_DENOMINATOR, FUNDING_PRECISION};
use crate::errors::AcceleratedError;
use crate::utils::math::SafeMath;
use anchor_lang::prelude::*;

/// Liquidity tier, derived from the underlying coin's on-chain depth. Drives leverage and risk
/// parameters. See `docs/risk-engine.md`.
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, Debug, InitSpace)]
pub enum RiskTier {
    Blue,
    Green,
    Amber,
    Red,
}

impl RiskTier {
    pub fn max_leverage_bps(&self) -> u64 {
        match self {
            RiskTier::Blue => 50_000,  // 5.0x
            RiskTier::Green => 40_000, // 4.0x
            RiskTier::Amber => 30_000, // 3.0x
            RiskTier::Red => 20_000,   // 2.0x
        }
    }

    pub fn maintenance_margin_bps(&self) -> u64 {
        match self {
            RiskTier::Blue => 800,   // 8%
            RiskTier::Green => 1_200, // 12%
            RiskTier::Amber => 1_800, // 18%
            RiskTier::Red => 2_500,   // 25%
        }
    }
}

#[account]
#[derive(InitSpace)]
pub struct Market {
    /// The graduated Pump.fun SPL mint this market prices.
    pub mint: Pubkey,
    /// Oracle price feed account (Pyth on mainnet, mock on localnet).
    pub oracle: Pubkey,
    /// Feed exponent (base-10) as published by the oracle.
    pub oracle_expo: i32,
    /// Maximum acceptable oracle confidence as a fraction of price, in bps.
    pub max_confidence_bps: u64,
    /// Risk tier governing leverage / margin caps.
    pub tier: RiskTier,
    /// Max position notional per account, in USDC base units.
    pub max_position: u64,
    /// Max aggregate open interest per side, in USDC base units.
    pub max_oi_per_side: u64,
    /// Current long open interest (base token units).
    pub long_oi: u128,
    /// Current short open interest (base token units).
    pub short_oi: u128,
    /// Cumulative funding for longs, 1e9 fixed-point USDC-per-base. Snapshotted into positions.
    pub cumulative_funding_long: i128,
    /// Cumulative funding for shorts.
    pub cumulative_funding_short: i128,
    /// Last funding crank timestamp.
    pub last_funding_ts: i64,
    /// Taker fee on notional, in bps.
    pub taker_fee_bps: u64,
    /// Per-market pause flag.
    pub paused: bool,
    /// PDA bump.
    pub bump: u8,
    pub _reserved: [u8; 64],
}

impl Market {
    /// Net skew = long_oi - short_oi (base units). Drives the funding rate sign.
    pub fn skew(&self) -> Result<i128> {
        (self.long_oi as i128).safe_sub(self.short_oi as i128)
    }

    /// Reject leverage above this market's tier cap (and the absolute protocol max).
    pub fn check_leverage(&self, leverage_bps: u64) -> Result<()> {
        require!(
            leverage_bps <= self.tier.max_leverage_bps(),
            AcceleratedError::LeverageTooHigh
        );
        require!(
            leverage_bps <= crate::constants::MAX_LEVERAGE_BPS,
            AcceleratedError::LeverageAboveProtocolMax
        );
        Ok(())
    }

    /// Compute the hourly funding rate (1e9 fixed-point) from skew and a sensitivity coefficient.
    /// Longs pay shorts when skew is positive. Bounded to +/- 0.1%/hr.
    pub fn compute_funding_rate(&self) -> Result<i128> {
        let total_oi = (self.long_oi as i128).safe_add(self.short_oi as i128)?;
        if total_oi == 0 {
            return Ok(0);
        }
        let skew = self.skew()?;
        // rate = skew / total_oi * 0.001 (10 bps cap baked into the scale)
        let scaled = skew
            .safe_mul(FUNDING_PRECISION as i128)?
            .safe_div(total_oi)?
            .safe_mul(10)? // 10 bps max magnitude
            .safe_div(BPS_DENOMINATOR as i128)?;
        let cap = (FUNDING_PRECISION as i128).safe_mul(10)?.safe_div(BPS_DENOMINATOR as i128)?;
        Ok(scaled.clamp(-cap, cap))
    }
}
