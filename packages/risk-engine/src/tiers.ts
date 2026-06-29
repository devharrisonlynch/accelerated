// Leverage-tier assignment. Every graduated coin is bucketed by its on-chain liquidity depth (and
// a couple of safety overrides) into a tier that fixes its leverage cap, maintenance margin, and
// position/OI limits. The on-chain program enforces whatever tier the engine commits.

export type Tier = 'Blue' | 'Green' | 'Amber' | 'Red';

export interface TierConfig {
  tier: Tier;
  maxLeverage: number;
  maintenanceMarginBps: number;
  maxPositionUsd: number;
  maxOiPerSideUsd: number;
  /** Max acceptable oracle confidence as a fraction of price, in bps. */
  maxConfidenceBps: number;
}

export const TIERS: Record<Tier, TierConfig> = {
  Blue: { tier: 'Blue', maxLeverage: 5, maintenanceMarginBps: 800, maxPositionUsd: 50_000, maxOiPerSideUsd: 1_500_000, maxConfidenceBps: 40 },
  Green: { tier: 'Green', maxLeverage: 4, maintenanceMarginBps: 1_200, maxPositionUsd: 20_000, maxOiPerSideUsd: 600_000, maxConfidenceBps: 80 },
  Amber: { tier: 'Amber', maxLeverage: 3, maintenanceMarginBps: 1_800, maxPositionUsd: 7_500, maxOiPerSideUsd: 200_000, maxConfidenceBps: 150 },
  Red: { tier: 'Red', maxLeverage: 2, maintenanceMarginBps: 2_500, maxPositionUsd: 2_000, maxOiPerSideUsd: 60_000, maxConfidenceBps: 250 },
};

export interface CoinSnapshot {
  /** Graduated AMM liquidity, USD. */
  liquidityUsd: number;
  /** 24h spot volume, USD. */
  volume24hUsd: number;
  /** Seconds since graduation. */
  ageSeconds: number;
  /** Observed oracle confidence as a fraction of price (e.g. 0.004 = 0.4%). */
  oracleConfidence: number;
}

const GRACE_PERIOD = 6 * 3_600; // 6h post-graduation: capped at Red regardless of depth

/**
 * Assign a tier from a coin snapshot. Liquidity sets the base tier; freshly graduated coins and
 * coins with a wide oracle band are demoted for safety.
 */
export function assignTier(snap: CoinSnapshot): TierConfig {
  let tier: Tier;
  if (snap.liquidityUsd >= 2_000_000) tier = 'Blue';
  else if (snap.liquidityUsd >= 500_000) tier = 'Green';
  else if (snap.liquidityUsd >= 100_000) tier = 'Amber';
  else tier = 'Red';

  // Safety demotions
  if (snap.ageSeconds < GRACE_PERIOD) tier = demote(tier, 'Red');
  if (snap.oracleConfidence > 0.01) tier = demote(tier, 'Amber');
  // Thin volume relative to liquidity hints at a fragile market
  if (snap.volume24hUsd < snap.liquidityUsd * 0.1) tier = demote(tier, 'Amber');

  return TIERS[tier];
}

const ORDER: Tier[] = ['Blue', 'Green', 'Amber', 'Red'];

/** Demote `tier` to at most `floor` (never promote). */
function demote(tier: Tier, floor: Tier): Tier {
  return ORDER[Math.max(ORDER.indexOf(tier), ORDER.indexOf(floor))];
}
