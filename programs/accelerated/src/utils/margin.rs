//! Margin and liquidation math.
//!
//! A position's *equity* is its posted collateral plus unrealized PnL minus accrued funding.
//! The *margin ratio* is equity / notional. When the margin ratio falls below the market's
//! maintenance-margin requirement, the position is liquidatable by any keeper.

use crate::constants::{BPS_DENOMINATOR, PRICE_PRECISION};
use crate::errors::AcceleratedError;
use crate::utils::math::{notional, unrealized_pnl, SafeMath};
use anchor_lang::prelude::*;

/// Account equity in USDC base units (saturating at zero — a position can be underwater but never
/// negative equity from the trader's perspective; the deficit is the vault's loss).
pub fn equity(collateral: u64, pnl: i128, funding_owed: i128) -> Result<u64> {
    let base = collateral as i128;
    let eq = base.safe_add(pnl)?.safe_sub(funding_owed)?;
    Ok(if eq < 0 { 0 } else { eq as u64 })
}

/// Margin ratio in basis points: equity / notional * 10_000.
pub fn margin_ratio_bps(
    collateral: u64,
    base_size: u128,
    entry_price: u128,
    mark_price: u128,
    is_long: bool,
    funding_owed: i128,
) -> Result<u64> {
    let pnl = unrealized_pnl(base_size, entry_price, mark_price, is_long)?;
    let eq = equity(collateral, pnl, funding_owed)? as u128;
    let notional_now = notional(base_size, mark_price)?;
    if notional_now == 0 {
        return Ok(BPS_DENOMINATOR);
    }
    let ratio = eq.safe_mul(BPS_DENOMINATOR as u128)?.safe_div(notional_now)?;
    Ok(u64::try_from(ratio).unwrap_or(u64::MAX))
}

/// True when the position's margin ratio is at or below the maintenance requirement.
pub fn is_liquidatable(margin_ratio_bps: u64, maintenance_margin_bps: u64) -> bool {
    margin_ratio_bps <= maintenance_margin_bps
}

/// Effective leverage in bps at entry: notional / collateral * 10_000.
pub fn entry_leverage_bps(notional_usdc: u128, collateral: u64) -> Result<u64> {
    if collateral == 0 {
        return err!(AcceleratedError::CollateralTooLow);
    }
    let lev = notional_usdc.safe_mul(BPS_DENOMINATOR as u128)?.safe_div(collateral as u128)?;
    Ok(u64::try_from(lev).unwrap_or(u64::MAX))
}

/// The price at which a position's equity hits the maintenance threshold.
///
/// For a long:  liq = entry * (1 - 1/leverage + mmr)
/// For a short: liq = entry * (1 + 1/leverage - mmr)
/// Returned in PRICE_PRECISION units; 0 means "effectively unliquidatable in range".
pub fn liquidation_price(
    entry_price: u128,
    collateral: u64,
    base_size: u128,
    maintenance_margin_bps: u64,
    is_long: bool,
) -> Result<u128> {
    let notional_at_entry = notional(base_size, entry_price)?;
    if notional_at_entry == 0 {
        return Ok(0);
    }
    // maintenance requirement in USDC
    let maint = notional_at_entry
        .safe_mul(maintenance_margin_bps as u128)?
        .safe_div(BPS_DENOMINATOR as u128)?;
    // price move (in price units) that exhausts collateral down to maintenance
    let buffer = (collateral as u128).safe_sub(maint).unwrap_or(0);
    let price_delta = buffer.safe_mul(PRICE_PRECISION)?.safe_div(base_size)?;
    if is_long {
        Ok(entry_price.safe_sub(price_delta).unwrap_or(0))
    } else {
        entry_price.safe_add(price_delta)
    }
}
