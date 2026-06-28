'use client';

import { useState } from 'react';
import { fmtPrice, fmtUsd } from '@/lib/format';
import { cn } from '@/lib/cn';

interface DemoPosition {
  symbol: string;
  side: 'Long' | 'Short';
  size: number;
  leverage: number;
  entry: number;
  mark: number;
  liq: number;
  pnl: number;
  pnlPct: number;
}

// Illustrative positions so the panel isn't empty in the demo build.
const DEMO_POSITIONS: DemoPosition[] = [
  { symbol: 'WIFHAT', side: 'Long', size: 1240, leverage: 5, entry: 2.21, mark: 2.4137, pnl: 113.42, pnlPct: 51.3, liq: 1.86 },
  { symbol: 'FRACT', side: 'Short', size: 480, leverage: 3, entry: 0.0101, mark: 0.008812, pnl: 61.2, pnlPct: 38.2, liq: 0.0123 },
  { symbol: 'SIGMA', side: 'Long', size: 210, leverage: 2, entry: 0.000361, mark: 0.0003319, pnl: -16.9, pnlPct: -16.1, liq: 0.000201 },
];

const TABS = ['Positions', 'Open Orders', 'Trade History'] as const;

export function PositionsPanel() {
  const [tab, setTab] = useState<(typeof TABS)[number]>('Positions');

  return (
    <div className="panel flex flex-col">
      <div className="flex items-center gap-1 border-b border-white/5 px-3 py-2">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              'rounded-md px-3 py-1.5 text-sm transition-colors',
              tab === t ? 'bg-white/[0.06] text-white' : 'text-white/45 hover:text-white/80',
            )}
          >
            {t}
            {t === 'Positions' && (
              <span className="ml-1.5 rounded bg-brew-amber/20 px-1.5 py-0.5 text-[10px] text-brew-amber">
                {DEMO_POSITIONS.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {tab === 'Positions' ? (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wider text-white/35">
                <Th>Market</Th>
                <Th>Side</Th>
                <Th className="text-right">Size</Th>
                <Th className="text-right">Entry</Th>
                <Th className="text-right">Mark</Th>
                <Th className="text-right">Liq. price</Th>
                <Th className="text-right">PnL</Th>
                <Th />
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {DEMO_POSITIONS.map((p) => (
                <tr key={p.symbol} className="hover:bg-white/[0.02]">
                  <td className="px-4 py-3 font-semibold">{p.symbol}</td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        'rounded px-1.5 py-0.5 text-xs font-medium',
                        p.side === 'Long' ? 'bg-long/15 text-long' : 'bg-short/15 text-short',
                      )}
                    >
                      {p.side} {p.leverage}×
                    </span>
                  </td>
                  <td className="stat-num px-4 py-3 text-right">{fmtUsd(p.size, { compact: true })}</td>
                  <td className="stat-num px-4 py-3 text-right text-white/70">{fmtPrice(p.entry)}</td>
                  <td className="stat-num px-4 py-3 text-right text-white/70">{fmtPrice(p.mark)}</td>
                  <td className="stat-num px-4 py-3 text-right text-short/80">{fmtPrice(p.liq)}</td>
                  <td
                    className={cn(
                      'stat-num px-4 py-3 text-right',
                      p.pnl >= 0 ? 'text-long' : 'text-short',
                    )}
                  >
                    {p.pnl >= 0 ? '+' : ''}
                    {fmtUsd(p.pnl, { decimals: 2 })}
                    <span className="ml-1 text-xs opacity-70">
                      ({p.pnl >= 0 ? '+' : ''}
                      {p.pnlPct.toFixed(1)}%)
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button className="rounded-md border border-white/10 px-2.5 py-1 text-xs text-white/70 hover:bg-white/5">
                      Close
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="flex h-40 items-center justify-center text-sm text-white/30">
          No {tab.toLowerCase()} yet.
        </div>
      )}
    </div>
  );
}

function Th({ children, className }: { children?: React.ReactNode; className?: string }) {
  return <th className={cn('px-4 py-2.5 font-medium', className)}>{children}</th>;
}
