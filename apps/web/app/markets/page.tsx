import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Ticker } from '@/components/ui/Ticker';
import { MarketTable } from '@/components/MarketTable';
import { TIER_META, type Tier } from '@/lib/markets';

const TIERS: Tier[] = ['Blue', 'Green', 'Amber', 'Red'];

export default function MarketsPage() {
  return (
    <>
      <Navbar />
      <Ticker />
      <main className="mx-auto max-w-7xl px-5 py-12">
        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">Markets</h1>
        <p className="mt-2 max-w-2xl text-white/55">
          Every graduated Pump.fun coin, sorted into a leverage tier by the risk engine. Tiers are
          recomputed each funding interval from on-chain liquidity depth.
        </p>

        {/* Tier legend */}
        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {TIERS.map((t) => {
            const meta = TIER_META[t];
            return (
              <div key={t} className="panel-pad">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: meta.color }} />
                  <span className="font-semibold" style={{ color: meta.color }}>
                    {t}
                  </span>
                  <span className="ml-auto stat-num text-sm text-brew-amber">{meta.maxLev}×</span>
                </div>
                <div className="mt-2 text-xs text-white/45">{meta.label}</div>
                <div className="stat-num mt-1 text-xs text-white/30">
                  maint. margin {(meta.mmr * 100).toFixed(0)}%
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-8">
          <MarketTable />
        </div>
      </main>
      <Footer />
    </>
  );
}
