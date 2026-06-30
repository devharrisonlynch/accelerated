//! Global protocol configuration. A single PDA holds the admin authority and kill switch.

use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct Protocol {
    /// Admin authority allowed to list markets and tune parameters.
    pub authority: Pubkey,
    /// Pending authority for a two-step ownership transfer.
    pub pending_authority: Pubkey,
    /// USDC mint used for collateral and settlement.
    pub collateral_mint: Pubkey,
    /// The shared liquidity vault PDA.
    pub vault: Pubkey,
    /// Number of markets listed so far (monotonic; used only for stats).
    pub market_count: u64,
    /// Global kill switch. When true, only closes and liquidations are allowed.
    pub paused: bool,
    /// Default protocol fee on position notional, in bps.
    pub taker_fee_bps: u64,
    /// PDA bump.
    pub bump: u8,
    /// Reserved for forward-compatible upgrades.
    pub _reserved: [u8; 64],
}

impl Protocol {
    pub fn is_admin(&self, who: &Pubkey) -> bool {
        self.authority == *who
    }
}
