// Floating-point mirror of the on-chain margin math
// (programs/accelerated/src/utils/margin.rs). Use these for instant client-side quoting; the chain
// remains the source of truth.

import { BPS, type RiskTier, TIER_PARAMS } from '../constants.js';

export interface PositionQuote {
  /** Position notional in USDC. */
  notional: number;
  /** Position size in base token units. */
  size: number;
  /** Taker fee charged up front, in USDC. */
  fee: number;
  /** Realised leverage after fees. */
  effectiveLeverage: number;
  /** Price at which the position becomes liquidatable. */
  liquidationPrice: number;
}

const bps = (n: bigint) => Number(n) / Number(BPS);

/** Quote a new position the same way `open_position` sizes it on-chain. */
export function quotePosition(args: {
  collateral: number;
  leverage: number;
  price: number;
  isLong: boolean;
  tier: RiskTier;
  takerFeeBps?: number;
}): PositionQuote {
  const { collateral, leverage, price, isLong, tier } = args;
  const takerFeeBps = args.takerFeeBps ?? 25;
  const mmr = bps(TIER_PARAMS[tier].maintenanceMarginBps);

  const fee = (collateral * leverage * takerFeeBps) / 10_000;
  const collateralAfterFee = Math.max(0, collateral - fee);
  const notional = collateralAfterFee * leverage;
  const size = price > 0 ? notional / price : 0;
  const effectiveLeverage = collateralAfterFee > 0 ? notional / collateralAfterFee : 0;

  const maintenance = notional * mmr;
  const buffer = Math.max(0, collateralAfterFee - maintenance);
  const priceDelta = size > 0 ? buffer / size : 0;
  const liquidationPrice = isLong ? Math.max(0, price - priceDelta) : price + priceDelta;

  return { notional, size, fee, effectiveLeverage, liquidationPrice };
}

/** Margin ratio in bps, matching `margin_ratio_bps` on-chain. */
export function marginRatioBps(args: {
  collateral: number;
  size: number;
  entryPrice: number;
  markPrice: number;
  isLong: boolean;
  fundingOwed?: number;
}): number {
  const { collateral, size, entryPrice, markPrice, isLong } = args;
  const fundingOwed = args.fundingOwed ?? 0;
  const pnl = isLong ? size * (markPrice - entryPrice) : size * (entryPrice - markPrice);
  const equity = Math.max(0, collateral + pnl - fundingOwed);
  const notional = size * markPrice;
  if (notional === 0) return Number(BPS);
  return (equity / notional) * Number(BPS);
}

/** Whether a position can be liquidated at the given mark. */
export function isLiquidatable(marginRatioBps: number, tier: RiskTier): boolean {
  return marginRatioBps <= Number(TIER_PARAMS[tier].maintenanceMarginBps);
}
