import assert from 'node:assert/strict';
import { test } from 'node:test';
import { isLiquidatable, marginRatioBps, quotePosition } from './margin.js';

test('quotePosition sizes notional net of fees', () => {
  const q = quotePosition({ collateral: 100, leverage: 5, price: 2, isLong: true, tier: 'Blue' });
  // fee = 100 * 5 * 25 / 10000 = 1.25 ; collateralAfterFee = 98.75 ; notional = 493.75
  assert.ok(Math.abs(q.fee - 1.25) < 1e-9);
  assert.ok(Math.abs(q.notional - 493.75) < 1e-9);
  assert.ok(q.size > 0);
});

test('long liquidation price sits below entry', () => {
  const q = quotePosition({ collateral: 100, leverage: 5, price: 2, isLong: true, tier: 'Blue' });
  assert.ok(q.liquidationPrice < 2);
  assert.ok(q.liquidationPrice > 0);
});

test('short liquidation price sits above entry', () => {
  const q = quotePosition({ collateral: 100, leverage: 5, price: 2, isLong: false, tier: 'Blue' });
  assert.ok(q.liquidationPrice > 2);
});

test('margin ratio falls as price moves against a long', () => {
  const base = { collateral: 100, size: 250, entryPrice: 2, isLong: true as const };
  const healthy = marginRatioBps({ ...base, markPrice: 2 });
  const stressed = marginRatioBps({ ...base, markPrice: 1.8 });
  assert.ok(stressed < healthy);
});

test('red-tier liquidation triggers at a higher margin ratio than blue', () => {
  // 25% vs 8% maintenance
  assert.equal(isLiquidatable(2000, 'Red'), true);
  assert.equal(isLiquidatable(2000, 'Blue'), false);
});
