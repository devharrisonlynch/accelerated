'use client';

import { useMemo, useState } from 'react';
import type { Market } from '@/lib/markets';
import { TIER_META } from '@/lib/markets';
import { quote } from '@/lib/trade-math';
import { fmtPrice, fmtUsd } from '@/lib/format';
import { cn } from '@/lib/cn';

const PRESETS = [50, 100, 250, 1000];

export function OrderPanel({ market }: { market: Market }) {
  const [isLong, setIsLong] = useState(true);
  const [collateral, setCollateral] = useState(100);
  const [leverage, setLeverage] = useState(2);

  const maxLev = TIER_META[market.tier].maxLev;
  const lev = Math.min(leverage, maxLev);

  const q = useMemo(
    () => quote({ collateral, leverage: lev, price: market.price, isLong, tier: market.tier }),
    [collateral, lev, market.price, isLong, market.tier],
  );

  return (
    <div className="panel flex flex-col">
      {/* Long / Short toggle */}
      <div className="grid grid-cols-2 gap-2 p-3">
        <button
          onClick={() => setIsLong(true)}
          className={cn('btn', isLong ? 'btn-long' : 'btn-ghost')}
        >
          Long
        </button>
        <button
          onClick={() => setIsLong(false)}
          className={cn('btn', !isLong ? 'btn-short' : 'btn-ghost')}
        >
          Short
        </button>
      </div>

      <div className="space-y-5 px-4 pb-4">
        {/* Collateral */}
        <div>
          <div className="mb-1.5 flex items-center justify-between text-xs text-white/50">
            <span>Collateral</span>
            <span>USDC</span>
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-ink-700 px-3 py-2.5 focus-within:border-brew-amber/50">
            <span className="text-white/40">$</span>
            <input
              type="number"
              value={collateral}
              min={5}
              onChange={(e) => setCollateral(Math.max(0, Number(e.target.value)))}
              className="w-full bg-transparent font-mono text-lg outline-none"
            />
          </div>
          <div className="mt-2 flex gap-2">
            {PRESETS.map((p) => (
              <button
                key={p}
                onClick={() => setCollateral(p)}
                className="flex-1 rounded-md border border-white/5 bg-white/5 py-1.5 text-xs text-white/60 transition-colors hover:bg-white/10 hover:text-white"
              >
                ${p}
              </button>
            ))}
          </div>
        </div>

        {/* Leverage */}
        <div>
          <div className="mb-2 flex items-center justify-between text-xs">
            <span className="text-white/50">Leverage</span>
            <span className="stat-num font-semibold text-brew-amber">{lev.toFixed(1)}×</span>
          </div>
          <input
            type="range"
            className="lev w-full"
            min={1}
            max={maxLev}
            step={0.5}
            value={lev}
            onChange={(e) => setLeverage(Number(e.target.value))}
          />
          <div className="mt-1.5 flex justify-between text-[10px] text-white/30">
            <span>1×</span>
            <span>
              max {maxLev}× · {market.tier}
            </span>
          </div>
        </div>

        {/* Quote */}
        <div className="space-y-2 rounded-lg bg-ink-700/60 p-3 text-sm">
          <Row label="Entry price" value={fmtPrice(market.price)} />
          <Row label="Position size" value={`${fmtUsd(q.notional, { compact: true })}`} />
          <Row
            label="Liquidation price"
            value={fmtPrice(q.liquidationPrice)}
            valueClass={isLong ? 'text-short' : 'text-short'}
          />
          <Row label="Taker fee" value={fmtUsd(q.fee, { decimals: 2 })} muted />
          <Row label="Effective leverage" value={`${q.effectiveLeverage.toFixed(2)}×`} muted />
        </div>

        <button className={cn('w-full text-base', isLong ? 'btn-long' : 'btn-short')}>
          {isLong ? 'Open Long' : 'Open Short'} · {lev.toFixed(1)}×
        </button>

        <p className="text-center text-[11px] leading-relaxed text-white/30">
          Connect a wallet to trade on devnet. Quotes are previews; the chain is the source of truth.
        </p>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  muted,
  valueClass,
}: {
  label: string;
  value: string;
  muted?: boolean;
  valueClass?: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-white/45">{label}</span>
      <span className={cn('stat-num', muted ? 'text-white/60' : 'text-white', valueClass)}>
        {value}
      </span>
    </div>
  );
}
