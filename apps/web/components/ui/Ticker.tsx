import { MARKETS } from '@/lib/markets';
import { fmtPct, fmtPrice } from '@/lib/format';
import { cn } from '@/lib/cn';

export function Ticker() {
  const items = [...MARKETS, ...MARKETS]; // duplicated for a seamless marquee loop
  return (
    <div className="relative overflow-hidden border-y border-white/5 bg-ink-800/60 py-2.5">
      <div className="flex w-max animate-ticker gap-8 px-4">
        {items.map((m, i) => (
          <div key={`${m.symbol}-${i}`} className="flex items-center gap-2 whitespace-nowrap text-sm">
            <span className="font-semibold">{m.symbol}</span>
            <span className="stat-num text-white/70">{fmtPrice(m.price)}</span>
            <span className={cn('stat-num text-xs', m.change24h >= 0 ? 'text-long' : 'text-short')}>
              {fmtPct(m.change24h)}
            </span>
          </div>
        ))}
      </div>
      <div className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-ink to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-ink to-transparent" />
    </div>
  );
}
