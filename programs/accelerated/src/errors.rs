//! Custom program errors.

use anchor_lang::prelude::*;

#[error_code]
pub enum AcceleratedError {
    #[msg("Protocol is currently paused")]
    ProtocolPaused,
    #[msg("Market is currently paused")]
    MarketPaused,
    #[msg("Requested leverage exceeds the market's tier cap")]
    LeverageTooHigh,
    #[msg("Leverage exceeds the absolute protocol maximum of 5x")]
    LeverageAboveProtocolMax,
    #[msg("Collateral is below the minimum required to open a position")]
    CollateralTooLow,
    #[msg("Position notional exceeds the market's max position size")]
    PositionTooLarge,
    #[msg("Opening this position would breach the market open-interest cap")]
    OpenInterestCapBreached,
    #[msg("Oracle price is stale")]
    StaleOracle,
    #[msg("Oracle confidence interval is too wide to price safely")]
    OracleConfidenceTooWide,
    #[msg("Oracle price is non-positive")]
    InvalidOraclePrice,
    #[msg("Position is still healthy and cannot be liquidated")]
    PositionHealthy,
    #[msg("Position margin ratio is below maintenance; reduce size or add collateral")]
    InsufficientMargin,
    #[msg("Funding interval has not elapsed yet")]
    FundingNotDue,
    #[msg("Vault has insufficient free liquidity to underwrite this position")]
    InsufficientVaultLiquidity,
    #[msg("Withdrawal would push vault utilization above the safe ceiling")]
    VaultUtilizationTooHigh,
    #[msg("Math overflow")]
    MathOverflow,
    #[msg("Numeric conversion failed")]
    ConversionError,
    #[msg("Caller is not authorized for this action")]
    Unauthorized,
    #[msg("Provided account does not match the expected market mint")]
    MintMismatch,
}
