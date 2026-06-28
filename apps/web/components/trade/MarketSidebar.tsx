'use client';

import { useState } from 'react';
import { MARKETS, type Market } from '@/lib/markets';
import { fmtPct, fmtPrice } from '@/lib/format';
import { cn } from '@/lib/cn';
import { TierBadge } from '../ui/TierBadge';

export function MarketSidebar({
  active,
  onSelect,
}: {
  active: string;
  onSelect: (m: Market) => void;
}) {
  const [query, setQuery] = useState('');
  const filtered = MARKETS.filter(
    (m) =>
      m.symbol.toLowerCase().includes(query.toLowerCase()) ||
      m.name.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <div className="panel flex h-full flex-col">
      <div className="border-b border-white/5 p-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search the trenches…"
          className="w-full rounded-lg border border-white/10 bg-ink-700 px-3 py-2 text-sm outline-none placeholder:text-white/30 focus:border-brew-amber/50"
        />
      </div>
      <div className="flex-1 overflow-y-auto">
        {filtered.map((m) => (
          <button
            key={m.symbol}
            onClick={() => onSelect(m)}
            className={cn(
              'flex w-full items-center justify-between gap-2 border-l-2 px-4 py-3 text-left transition-colors',
              m.symbol === active
                ? 'border-brew-amber bg-white/[0.04]'
                : 'border-transparent hover:bg-white/[0.02]',
            )}
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold">{m.symbol}</span>
                <TierBadge tier={m.tier} />
              </div>
              <div className="stat-num mt-0.5 text-xs text-white/45">{fmtPrice(m.price)}</div>
            </div>
            <span className={cn('stat-num text-xs', m.change24h >= 0 ? 'text-long' : 'text-short')}>
              {fmtPct(m.change24h)}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
