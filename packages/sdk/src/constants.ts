import { PublicKey } from '@solana/web3.js';

/** Deployed program id (placeholder devnet vanity address). */
export const PROGRAM_ID = new PublicKey('ACCELeRAtedPRPxxxxxxxxxxxxxxxxxxxxxxxxxxxx');

/** Fixed-point: 1.0 in price space (USDC 6 decimals). */
export const PRICE_PRECISION = 1_000_000n;

/** Fixed-point: 1.0 in funding-rate space. */
export const FUNDING_PRECISION = 1_000_000_000n;

/** Basis-point denominator. */
export const BPS = 10_000n;

/** Absolute protocol leverage ceiling, in bps (5.00x). */
export const MAX_LEVERAGE_BPS = 50_000n;

/** Canonical PDA seeds. */
export const SEEDS = {
  protocol: Buffer.from('protocol'),
  vault: Buffer.from('vault'),
  vaultAuthority: Buffer.from('vault_authority'),
  market: Buffer.from('market'),
  position: Buffer.from('position'),
  lpMint: Buffer.from('lp_mint'),
} as const;

export type RiskTier = 'Blue' | 'Green' | 'Amber' | 'Red';

export const TIER_PARAMS: Record<RiskTier, { maxLeverageBps: bigint; maintenanceMarginBps: bigint }> = {
  Blue: { maxLeverageBps: 50_000n, maintenanceMarginBps: 800n },
  Green: { maxLeverageBps: 40_000n, maintenanceMarginBps: 1_200n },
  Amber: { maxLeverageBps: 30_000n, maintenanceMarginBps: 1_800n },
  Red: { maxLeverageBps: 20_000n, maintenanceMarginBps: 2_500n },
};
