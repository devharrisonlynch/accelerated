//! A trader's leveraged position in a single market. One PDA per (owner, market).

use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct Position {
    /// Position owner.
    pub owner: Pubkey,
    /// Market this position belongs to.
    pub market: Pubkey,
    /// Direction.
    pub is_long: bool,
    /// Size in base token units.
    pub base_size: u128,
    /// Posted collateral in USDC base units.
    pub collateral: u64,
    /// Entry price in PRICE_PRECISION units.
    pub entry_price: u128,
    /// Cumulative funding snapshot at entry/last update (1e9 fixed-point).
    pub funding_snapshot: i128,
    /// Notional at entry, cached for fee/limit accounting.
    pub entry_notional: u64,
    /// Open timestamp.
    pub opened_at: i64,
    /// Last time funding/PnL was settled into this position.
    pub last_updated: i64,
    /// PDA bump.
    pub bump: u8,
    pub _reserved: [u8; 32],
}

impl Position {
    pub fn is_open(&self) -> bool {
        self.base_size > 0
    }
}
