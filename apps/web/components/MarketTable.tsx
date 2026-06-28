import Link from 'next/link';
import { MARKETS } from '@/lib/markets';
import { fmtPct, fmtPrice, fmtUsd } from '@/lib/format';
import { cn } from '@/lib/cn';
import { TierBadge } from './ui/TierBadge';

export function MarketTable({ limit }: { limit?: number }) {
  const rows = limit ? MARKETS.slice(0, limit) : MARKETS;
  return (
    <div className="panel overflow-hidden">
      <div className="grid grid-cols-[1.6fr_1fr_1fr_1fr_1fr_auto] gap-4 border-b border-white/5 px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-white/40">
        <span>Market</span>
        <span className="text-right">Price</span>
        <span className="text-right">24h</span>
        <span className="hidden text-right sm:block">24h Volume</span>
        <span className="hidden text-right md:block">Funding /1h</span>
        <span className="text-right">Max</span>
      </div>
      <div className="divide-y divide-white/5">
        {rows.map((m) => (
          <Link
            key={m.symbol}
            href={`/trade?market=${m.symbol}`}
            className="grid grid-cols-[1.6fr_1fr_1fr_1fr_1fr_auto] items-center gap-4 px-5 py-3.5 transition-colors hover:bg-white/[0.03]"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brew-gradient text-xs font-bold text-ink">
                {m.symbol.slice(0, 2)}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{m.symbol}</span>
                  <TierBadge tier={m.tier} />
                </div>
                <div className="truncate text-xs text-white/40">{m.name}</div>
              </div>
            </div>
            <span className="stat-num text-right">{fmtPrice(m.price)}</span>
            <span className={cn('stat-num text-right', m.change24h >= 0 ? 'text-long' : 'text-short')}>
              {fmtPct(m.change24h)}
            </span>
            <span className="stat-num hidden text-right text-white/70 sm:block">
              {fmtUsd(m.volume24h, { compact: true })}
            </span>
            <span
              className={cn(
                'stat-num hidden text-right text-xs md:block',
                m.fundingRate >= 0 ? 'text-long/80' : 'text-short/80',
              )}
            >
              {(m.fundingRate * 100).toFixed(4)}%
            </span>
            <span className="stat-num text-right text-sm font-semibold text-brew-amber">
              {m.maxLeverage}×
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
