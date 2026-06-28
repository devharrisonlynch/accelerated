import type { Market } from '@/lib/markets';
import { fmtPct, fmtPrice, fmtUsd } from '@/lib/format';
import { cn } from '@/lib/cn';
import { TierBadge } from '../ui/TierBadge';

export function MarketHeader({ market }: { market: Market }) {
  return (
    <div className="panel flex flex-wrap items-center gap-x-8 gap-y-3 px-5 py-3.5">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brew-gradient text-sm font-bold text-ink">
          {market.symbol.slice(0, 2)}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-lg font-semibold">{market.symbol}-PERP</span>
            <TierBadge tier={market.tier} withLabel />
          </div>
          <div className="text-xs text-white/40">{market.name}</div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-8 gap-y-2">
        <Metric label="Price" value={fmtPrice(market.price)} big />
        <Metric
          label="24h change"
          value={fmtPct(market.change24h)}
          valueClass={market.change24h >= 0 ? 'text-long' : 'text-short'}
        />
        <Metric label="24h volume" value={fmtUsd(market.volume24h, { compact: true })} />
        <Metric label="Open interest" value={fmtUsd(market.openInterest, { compact: true })} />
        <Metric
          label="Funding /1h"
          value={`${(market.fundingRate * 100).toFixed(4)}%`}
          valueClass={market.fundingRate >= 0 ? 'text-long/80' : 'text-short/80'}
        />
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
  big,
  valueClass,
}: {
  label: string;
  value: string;
  big?: boolean;
  valueClass?: string;
}) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wider text-white/35">{label}</div>
      <div className={cn('stat-num', big ? 'text-xl' : 'text-sm', valueClass)}>{value}</div>
    </div>
  );
}
