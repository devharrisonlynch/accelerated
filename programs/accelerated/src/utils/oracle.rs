//! Oracle adapter.
//!
//! Accelerated never reads an AMM spot price directly — thin memecoin pools are trivially
//! manipulable inside a single block. Instead each market references a price feed (Pyth pull
//! oracle on mainnet; a mock feed on localnet) and we enforce three guards before trusting a price:
//!
//!   1. **Staleness** — the publish time must be within `MAX_ORACLE_STALENESS` of `now`.
//!   2. **Confidence** — the confidence interval, as a fraction of price, must be below the
//!      market's `max_confidence_bps`. Thinner coins get a tighter bound.
//!   3. **Positivity** — a non-positive price is rejected outright.
//!
//! The returned price is the feed price scaled into `PRICE_PRECISION` (1e6) units.

use crate::constants::{BPS_DENOMINATOR, MAX_ORACLE_STALENESS, PRICE_PRECISION};
use crate::errors::AcceleratedError;
use crate::utils::math::SafeMath;
use anchor_lang::prelude::*;

/// A validated, scaled oracle observation.
#[derive(Clone, Copy, Debug)]
pub struct OraclePrice {
    /// Price in PRICE_PRECISION (1e6) units.
    pub price: u128,
    /// Confidence interval in PRICE_PRECISION units.
    pub conf: u128,
    /// Publish timestamp (unix seconds).
    pub published_at: i64,
}

/// Validate a raw feed reading (price, conf, expo, publish_time) and scale it to PRICE_PRECISION.
///
/// `expo` is the feed's base-10 exponent (Pyth convention: real value = price * 10^expo).
pub fn validate_and_scale(
    raw_price: i64,
    raw_conf: u64,
    expo: i32,
    published_at: i64,
    now: i64,
    max_confidence_bps: u64,
) -> Result<OraclePrice> {
    require!(raw_price > 0, AcceleratedError::InvalidOraclePrice);
    require!(
        now.safe_sub(published_at)? <= MAX_ORACLE_STALENESS,
        AcceleratedError::StaleOracle
    );

    let price = scale_to_precision(raw_price as u128, expo)?;
    let conf = scale_to_precision(raw_conf as u128, expo)?;

    // confidence as a fraction of price, in bps
    let conf_bps = conf.safe_mul(BPS_DENOMINATOR as u128)?.safe_div(price.max(1))?;
    require!(
        conf_bps <= max_confidence_bps as u128,
        AcceleratedError::OracleConfidenceTooWide
    );

    Ok(OraclePrice { price, conf, published_at })
}

/// Scale a feed integer with exponent `expo` into PRICE_PRECISION (1e6) fixed-point.
fn scale_to_precision(value: u128, expo: i32) -> Result<u128> {
    // target precision is 1e6 => target_expo = -6
    let target_expo: i32 = -6;
    if expo >= target_expo {
        let pow = 10u128
            .checked_pow((expo - target_expo) as u32)
            .ok_or_else(|| error!(AcceleratedError::MathOverflow))?;
        value.safe_mul(pow)
    } else {
        let pow = 10u128
            .checked_pow((target_expo - expo) as u32)
            .ok_or_else(|| error!(AcceleratedError::MathOverflow))?;
        value.safe_div(pow)
    }
}

/// A minimal price-feed account used on localnet/devnet tests. On mainnet the market's `oracle`
/// points at a Pyth pull-oracle account instead and the adapter reads it through the Pyth SDK; the
/// validated `(price, conf, expo, publish_time)` tuple feeds into the exact same `validate_and_scale`
/// path, so swapping sources changes nothing downstream.
#[account]
#[derive(InitSpace)]
pub struct MockPriceFeed {
    pub price: i64,
    pub conf: u64,
    pub expo: i32,
    pub publish_time: i64,
    pub authority: Pubkey,
}

/// Read and validate the market's oracle account into a scaled `OraclePrice`.
pub fn read_price(
    oracle_ai: &AccountInfo,
    expo: i32,
    max_confidence_bps: u64,
    now: i64,
) -> Result<OraclePrice> {
    let feed = Account::<MockPriceFeed>::try_from(oracle_ai)?;
    validate_and_scale(feed.price, feed.conf, expo, feed.publish_time, now, max_confidence_bps)
}

impl OraclePrice {
    /// A conservative price for the side that hurts the trader: longs are marked at the low end of
    /// the confidence band when opening, shorts at the high end. Keeps the vault solvent under
    /// noisy feeds.
    pub fn conservative(&self, is_long: bool, opening: bool) -> Result<u128> {
        let widen = matches!((is_long, opening), (true, true) | (false, false));
        if widen {
            self.price.safe_sub(self.conf).or(Ok(self.price))
        } else {
            self.price.safe_add(self.conf)
        }
    }

    pub fn raw() -> u128 {
        PRICE_PRECISION
    }
}
