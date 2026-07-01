//! # Accelerated
//!
//! Permissionless perpetual futures for the long tail of Solana memecoins. Every graduated
//! Pump.fun mint can be leverage-traded up to 5x against a single shared liquidity vault (ALP),
//! priced by a confidence-weighted oracle rather than a manipulable AMM spot.
//!
//! ## Program surface
//!
//! | Instruction          | Who        | What it does |
//! |----------------------|------------|--------------|
//! | `initialize_protocol`| admin      | Create global config + the shared vault. |
//! | `initialize_market`  | admin      | List a graduated mint as a leverage market. |
//! | `deposit_liquidity`  | LP         | Add USDC to the vault, mint ALP shares. |
//! | `withdraw_liquidity` | LP         | Burn ALP shares, redeem USDC. |
//! | `open_position`      | trader     | Post collateral, take a leveraged position. |
//! | `close_position`     | trader     | Settle PnL + funding, return equity. |
//! | `liquidate`          | keeper     | Close an underwater position for a bounty. |
//! | `crank_funding`      | keeper     | Advance funding accumulators from skew. |
//!
//! All margin math is checked fixed-point (`utils::math`), all pricing flows through the oracle
//! adapter (`utils::oracle`), and the vault can never pay out more than it holds — a shortfall is
//! socialized through the insurance fund first (`state::vault`).

use anchor_lang::prelude::*;

pub mod constants;
pub mod errors;
pub mod instructions;
pub mod state;
pub mod utils;

use instructions::*;

declare_id!("ACCELeRAtedPRPxxxxxxxxxxxxxxxxxxxxxxxxxxxx");

#[program]
pub mod accelerated {
    use super::*;

    /// Bootstrap global config + the shared ALP vault.
    pub fn initialize_protocol(ctx: Context<InitializeProtocol>, taker_fee_bps: u64) -> Result<()> {
        instructions::initialize_protocol::handler(ctx, taker_fee_bps)
    }

    /// List a graduated Pump.fun mint as a leverage market.
    pub fn initialize_market(ctx: Context<InitializeMarket>, params: MarketParams) -> Result<()> {
        instructions::initialize_market::handler(ctx, params)
    }

    /// Provide USDC liquidity to the vault and receive ALP shares.
    pub fn deposit_liquidity(ctx: Context<DepositLiquidity>, amount: u64) -> Result<()> {
        instructions::deposit_liquidity::handler(ctx, amount)
    }

    /// Redeem ALP shares for USDC.
    pub fn withdraw_liquidity(ctx: Context<WithdrawLiquidity>, shares: u64) -> Result<()> {
        instructions::withdraw_liquidity::handler(ctx, shares)
    }

    /// Open a leveraged long/short position.
    pub fn open_position(ctx: Context<OpenPosition>, params: OpenParams) -> Result<()> {
        instructions::open_position::handler(ctx, params)
    }

    /// Close a position and settle PnL + funding.
    pub fn close_position(ctx: Context<ClosePosition>) -> Result<()> {
        instructions::close_position::handler(ctx)
    }

    /// Liquidate an underwater position (permissionless, keeper-bountied).
    pub fn liquidate(ctx: Context<Liquidate>) -> Result<()> {
        instructions::liquidate::handler(ctx)
    }

    /// Advance a market's funding accumulators (permissionless crank).
    pub fn crank_funding(ctx: Context<CrankFunding>) -> Result<()> {
        instructions::crank_funding::handler(ctx)
    }
}
