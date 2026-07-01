//! Checked fixed-point helpers. Everything routes through `u128`/`i128` and returns a program error
//! on overflow rather than panicking, so a malicious input can never halt the program with a trap.

use crate::constants::PRICE_PRECISION;
use crate::errors::AcceleratedError;
use anchor_lang::prelude::*;

pub trait SafeMath: Sized {
    fn safe_add(self, rhs: Self) -> Result<Self>;
    fn safe_sub(self, rhs: Self) -> Result<Self>;
    fn safe_mul(self, rhs: Self) -> Result<Self>;
    fn safe_div(self, rhs: Self) -> Result<Self>;
}

macro_rules! impl_safe_math {
    ($t:ty) => {
        impl SafeMath for $t {
            #[inline(always)]
            fn safe_add(self, rhs: Self) -> Result<Self> {
                self.checked_add(rhs).ok_or_else(|| error!(AcceleratedError::MathOverflow))
            }
            #[inline(always)]
            fn safe_sub(self, rhs: Self) -> Result<Self> {
                self.checked_sub(rhs).ok_or_else(|| error!(AcceleratedError::MathOverflow))
            }
            #[inline(always)]
            fn safe_mul(self, rhs: Self) -> Result<Self> {
                self.checked_mul(rhs).ok_or_else(|| error!(AcceleratedError::MathOverflow))
            }
            #[inline(always)]
            fn safe_div(self, rhs: Self) -> Result<Self> {
                self.checked_div(rhs).ok_or_else(|| error!(AcceleratedError::MathOverflow))
            }
        }
    };
}

impl_safe_math!(u64);
impl_safe_math!(u128);
impl_safe_math!(i128);

/// Notional value of a position = |base_size| * price / PRICE_PRECISION.
/// `base_size` is in token base units, `price` in PRICE_PRECISION units, result in USDC base units.
pub fn notional(base_size: u128, price: u128) -> Result<u128> {
    base_size.safe_mul(price)?.safe_div(PRICE_PRECISION)
}

/// Convert a USDC-denominated notional back into base token size at `price`.
pub fn base_from_notional(notional_usdc: u128, price: u128) -> Result<u128> {
    notional_usdc.safe_mul(PRICE_PRECISION)?.safe_div(price)
}

/// Apply a basis-point rate to an amount, rounding down.
pub fn apply_bps(amount: u128, bps: u64) -> Result<u128> {
    amount.safe_mul(bps as u128)?.safe_div(crate::constants::BPS_DENOMINATOR as u128)
}

/// Signed unrealized PnL for a position, in USDC base units.
///
/// long:  size * (mark - entry) / P
/// short: size * (entry - mark) / P
pub fn unrealized_pnl(
    base_size: u128,
    entry_price: u128,
    mark_price: u128,
    is_long: bool,
) -> Result<i128> {
    let entry = entry_price as i128;
    let mark = mark_price as i128;
    let size = base_size as i128;
    let diff = if is_long { mark.safe_sub(entry)? } else { entry.safe_sub(mark)? };
    size.safe_mul(diff)?.safe_div(PRICE_PRECISION as i128)
}

#[inline(always)]
pub fn to_u64(value: u128) -> Result<u64> {
    u64::try_from(value).map_err(|_| error!(AcceleratedError::ConversionError))
}
