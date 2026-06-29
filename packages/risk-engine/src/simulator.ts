// Monte-Carlo-ish vault solvency simulator. Given a vault size, a set of markets, and a price-shock
// distribution, it estimates the probability the shared ALP vault is driven insolvent. Used to tune
// tier limits before they are committed on-chain. Deterministic given a seed (no Math.random) so CI
// runs are reproducible.

import type { Tier, TierConfig } from './tiers.js';
import { TIERS } from './tiers.js';

export interface MarketState {
  tier: Tier;
  /** Net trader open interest, USD (positive = traders net long the vault is net short). */
  netOiUsd: number;
}

export interface SimConfig {
  vaultUsd: number;
  insuranceFundUsd: number;
  markets: MarketState[];
  /** Number of shock scenarios. */
  trials: number;
  /** Max absolute price shock per market as a fraction (e.g. 0.6 = ±60%). */
  maxShock: number;
  seed: number;
}

export interface SimResult {
  trials: number;
  insolvencies: number;
  insolvencyProb: number;
  worstDrawdownUsd: number;
  meanPnlUsd: number;
}

/** Simple deterministic LCG so results are reproducible in CI. */
function lcg(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}

/**
 * The vault is the counterparty to net trader OI. A price shock `r` on a market moves trader PnL by
 * `netOi * r`, which the vault pays (loss) or collects (gain). Maintenance margin and per-side OI
 * caps bound how large any single market's contribution can be.
 */
export function simulateVault(cfg: SimConfig): SimResult {
  const rand = lcg(cfg.seed);
  let insolvencies = 0;
  let worstDrawdown = 0;
  let pnlSum = 0;

  for (let t = 0; t < cfg.trials; t++) {
    let vaultPnl = 0;
    for (const m of cfg.markets) {
      const tierCfg: TierConfig = TIERS[m.tier];
      // shock scaled down for safer tiers (lower leverage => smaller liquidation gap)
      const tierScale = tierCfg.maxLeverage / 5;
      const shock = (rand() * 2 - 1) * cfg.maxShock * tierScale;
      // traders gain `netOi * shock`; the vault loses it (capped by maintenance buffer)
      const cappedOi = Math.min(Math.abs(m.netOiUsd), tierCfg.maxOiPerSideUsd);
      vaultPnl -= Math.sign(m.netOiUsd) * cappedOi * shock;
    }
    pnlSum += vaultPnl;
    const equity = cfg.vaultUsd + cfg.insuranceFundUsd + vaultPnl;
    if (equity < 0) insolvencies++;
    worstDrawdown = Math.min(worstDrawdown, vaultPnl);
  }

  return {
    trials: cfg.trials,
    insolvencies,
    insolvencyProb: insolvencies / cfg.trials,
    worstDrawdownUsd: worstDrawdown,
    meanPnlUsd: pnlSum / cfg.trials,
  };
}
