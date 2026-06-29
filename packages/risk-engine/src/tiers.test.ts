import assert from 'node:assert/strict';
import { test } from 'node:test';
import { assignTier } from './tiers.js';
import { simulateVault } from './simulator.js';

const day = 24 * 3_600;

test('deep, mature, tight-oracle coin gets Blue', () => {
  const cfg = assignTier({ liquidityUsd: 3_000_000, volume24hUsd: 4_000_000, ageSeconds: 10 * day, oracleConfidence: 0.002 });
  assert.equal(cfg.tier, 'Blue');
  assert.equal(cfg.maxLeverage, 5);
});

test('fresh graduation is capped at Red regardless of depth', () => {
  const cfg = assignTier({ liquidityUsd: 5_000_000, volume24hUsd: 6_000_000, ageSeconds: 60, oracleConfidence: 0.002 });
  assert.equal(cfg.tier, 'Red');
});

test('wide oracle band demotes to at most Amber', () => {
  const cfg = assignTier({ liquidityUsd: 5_000_000, volume24hUsd: 6_000_000, ageSeconds: 30 * day, oracleConfidence: 0.05 });
  assert.ok(cfg.maxLeverage <= 3);
});

test('vault solvency simulation is deterministic and bounded', () => {
  const base = {
    vaultUsd: 9_000_000,
    insuranceFundUsd: 500_000,
    markets: [
      { tier: 'Blue' as const, netOiUsd: 1_200_000 },
      { tier: 'Amber' as const, netOiUsd: -300_000 },
      { tier: 'Red' as const, netOiUsd: 80_000 },
    ],
    trials: 5_000,
    maxShock: 0.6,
    seed: 42,
  };
  const a = simulateVault(base);
  const b = simulateVault(base);
  assert.deepEqual(a, b); // deterministic
  assert.ok(a.insolvencyProb >= 0 && a.insolvencyProb <= 1);
});
