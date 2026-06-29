import type { PublicKey } from '@solana/web3.js';
import type { RiskTier } from '../constants.js';

/** Decoded `Market` account. */
export interface MarketAccount {
  mint: PublicKey;
  oracle: PublicKey;
  oracleExpo: number;
  maxConfidenceBps: bigint;
  tier: RiskTier;
  maxPosition: bigint;
  maxOiPerSide: bigint;
  longOi: bigint;
  shortOi: bigint;
  cumulativeFundingLong: bigint;
  cumulativeFundingShort: bigint;
  lastFundingTs: bigint;
  takerFeeBps: bigint;
  paused: boolean;
}

/** Decoded `Position` account. */
export interface PositionAccount {
  owner: PublicKey;
  market: PublicKey;
  isLong: boolean;
  baseSize: bigint;
  collateral: bigint;
  entryPrice: bigint;
  fundingSnapshot: bigint;
  entryNotional: bigint;
  openedAt: bigint;
  lastUpdated: bigint;
}

/** Decoded `Vault` account. */
export interface VaultAccount {
  collateralMint: PublicKey;
  collateralAccount: PublicKey;
  lpMint: PublicKey;
  totalAssets: bigint;
  totalShares: bigint;
  reserved: bigint;
  insuranceFund: bigint;
  maxUtilizationBps: bigint;
}

/** Arguments to open a position. */
export interface OpenPositionArgs {
  isLong: boolean;
  /** Collateral to post, in USDC base units. */
  collateral: bigint;
  /** Requested leverage in bps (50_000 = 5x). */
  leverageBps: bigint;
  /** Slippage guard: max entry for longs, min entry for shorts (PRICE_PRECISION units). */
  priceLimit: bigint;
}
