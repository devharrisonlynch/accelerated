// Mirror of the on-chain margin math (programs/accelerated/src/utils/margin.rs), in floating point,
// for instant client-side quoting. The chain remains the source of truth; this is a preview.

import { TIER_META, type Tier } from './markets';

const TAKER_FEE_BPS = 25; // 0.25%

export interface Quote {
  notional: number;
  size: number;
  fee: number;
  effectiveLeverage: number;
  liquidationPrice: number;
  maintenanceMargin: number;
  collateralAfterFee: number;
}

export function quote(params: {
  collateral: number;
  leverage: number;
  price: number;
  isLong: boolean;
  tier: Tier;
}): Quote {
  const { collateral, leverage, price, isLong, tier } = params;
  const mmr = TIER_META[tier].mmr;

  const fee = (collateral * leverage * TAKER_FEE_BPS) / 10_000;
  const collateralAfterFee = Math.max(0, collateral - fee);
  const notional = collateralAfterFee * leverage;
  const size = price > 0 ? notional / price : 0;
  const effectiveLeverage = collateralAfterFee > 0 ? notional / collateralAfterFee : 0;
  const maintenanceMargin = notional * mmr;

  // price move that exhausts collateral down to the maintenance requirement
  const buffer = Math.max(0, collateralAfterFee - maintenanceMargin);
  const priceDelta = size > 0 ? (buffer * 1) / size : 0;
  const liquidationPrice = isLong ? Math.max(0, price - priceDelta) : price + priceDelta;

  return {
    notional,
    size,
    fee,
    effectiveLeverage,
    liquidationPrice,
    maintenanceMargin,
    collateralAfterFee,
  };
}

export function pnlAt(params: {
  entry: number;
  mark: number;
  size: number;
  isLong: boolean;
}): number {
  const { entry, mark, size, isLong } = params;
  return isLong ? size * (mark - entry) : size * (entry - mark);
}
