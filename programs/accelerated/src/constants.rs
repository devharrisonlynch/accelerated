//! Protocol-wide constants and fixed-point conventions.
//!
//! Accelerated uses integer fixed-point math everywhere. Prices and collateral are denominated in
//! USDC with 6 decimals (`PRICE_PRECISION`). Rates (funding, fees, margin) are expressed in basis
//! points unless explicitly noted as 1e9 fixed-point (`FUNDING_PRECISION`).

use anchor_lang::prelude::*;

/// 1.0 in price space. Matches USDC's 6 decimals so collateral and notional share a unit.
pub const PRICE_PRECISION: u128 = 1_000_000;

/// 1.0 in funding-rate space. Funding is accumulated with extra precision to avoid drift.
pub const FUNDING_PRECISION: u128 = 1_000_000_000;

/// Basis-point denominator. 10_000 bps = 100%.
pub const BPS_DENOMINATOR: u64 = 10_000;

/// Absolute protocol ceiling. No market may ever exceed 5x regardless of tier.
pub const MAX_LEVERAGE_BPS: u64 = 50_000; // 5.00x

/// Minimum collateral (in USDC base units) required to open a position. 5 USDC.
pub const MIN_COLLATERAL: u64 = 5_000_000;

/// Funding is cranked at most once per this interval (seconds). One hour.
pub const FUNDING_INTERVAL: i64 = 3_600;

/// Maximum age (seconds) of an oracle price before it is considered stale.
pub const MAX_ORACLE_STALENESS: i64 = 60;

/// Reward paid to a keeper that successfully liquidates a position, in bps of position notional.
pub const LIQUIDATION_FEE_BPS: u64 = 150; // 1.50%

/// Share of liquidation proceeds routed to the insurance fund, in bps.
pub const INSURANCE_FEE_BPS: u64 = 50; // 0.50%

/// Seeds for the canonical PDAs.
pub const PROTOCOL_SEED: &[u8] = b"protocol";
pub const VAULT_SEED: &[u8] = b"vault";
pub const VAULT_AUTHORITY_SEED: &[u8] = b"vault_authority";
pub const MARKET_SEED: &[u8] = b"market";
pub const POSITION_SEED: &[u8] = b"position";
pub const LP_MINT_SEED: &[u8] = b"lp_mint";
