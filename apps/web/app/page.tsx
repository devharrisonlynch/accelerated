import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Ticker } from '@/components/ui/Ticker';
import { MarketTable } from '@/components/MarketTable';
import { protocolStats } from '@/lib/markets';
import { fmtNum, fmtPct, fmtUsd } from '@/lib/format';

export default function Home() {
  return (
    <>
      <Navbar />
      <Ticker />

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="mx-auto max-w-7xl px-5 pb-20 pt-20 md:pt-28">
            <div className="animate-rise">
              <span className="chip text-brew-amber">
                <span className="h-1.5 w-1.5 rounded-full bg-brew-amber" />
                Now indexing every graduated Pump.fun coin
              </span>
            </div>
            <h1 className="mt-6 max-w-4xl text-balance text-5xl font-semibold leading-[1.05] tracking-tight md:text-7xl">
              Leverage the <span className="gradient-text">trenches.</span>
              <br />
              Every coin. Up to 5×.
            </h1>
            <p className="mt-6 max-w-2xl text-pretty text-lg leading-relaxed text-white/60">
              Accelerated is a permissionless perpetuals layer for the long tail of Solana memecoins.
              Any coin that graduates on Pump.fun becomes leverage-tradable in a single transaction —
              no dedicated liquidity, no order book, just one shared vault and an oracle-settled
              margin engine.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Link href="/trade" className="btn-brew text-base">
                Launch terminal →
              </Link>
              <Link href="/markets" className="btn-ghost text-base">
                Browse markets
              </Link>
            </div>

            {/* Stats strip */}
            <div className="mt-16 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-white/5 bg-white/5 md:grid-cols-4">
              <Stat label="Total value locked" value={fmtUsd(protocolStats.tvl, { compact: true })} />
              <Stat label="24h volume" value={fmtUsd(protocolStats.volume24h, { compact: true })} />
              <Stat label="Open interest" value={fmtUsd(protocolStats.openInterest, { compact: true })} />
              <Stat label="ALP vault APY" value={fmtPct(protocolStats.alpApy * 100, false)} accent />
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="mx-auto max-w-7xl px-5 py-16">
          <SectionHead
            eyebrow="How it percolates"
            title="One vault. Thousands of markets."
            sub="Traders never touch the underlying AMM. They post USDC and take a synthetic, oracle-settled position — so a coin needs zero dedicated liquidity to become leverage-tradable."
          />
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            <Step
              n="01"
              title="Graduate"
              body="A coin bonds and graduates on Pump.fun. The risk engine reads its on-chain depth and assigns a leverage tier (Blue → Red)."
            />
            <Step
              n="02"
              title="List instantly"
              body="A single transaction lists the mint as a perp market against a confidence-weighted oracle. No liquidity bootstrap, no market maker."
            />
            <Step
              n="03"
              title="Trade up to 5×"
              body="Post USDC collateral, go long or short with isolated margin. The shared ALP vault is your counterparty and earns the funding."
            />
          </div>
        </section>

        {/* Markets preview */}
        <section className="mx-auto max-w-7xl px-5 py-12">
          <div className="mb-6 flex items-end justify-between">
            <SectionHead eyebrow="Live markets" title="Hot in the trenches" />
            <Link href="/markets" className="text-sm text-brew-green hover:underline">
              View all {protocolStats.markets} →
            </Link>
          </div>
          <MarketTable limit={6} />
        </section>

        {/* Features */}
        <section className="mx-auto max-w-7xl px-5 py-16">
          <SectionHead
            eyebrow="Why Accelerated"
            title="Built for thin coins and fat tails"
            sub="A synthetic margin model that stays solvent even when the underlying chart goes vertical."
          />
          <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            <Feature
              icon="⚡"
              title="Instant markets"
              body="Any graduated mint is tradable in one tx — no per-market liquidity bootstrap."
            />
            <Feature
              icon="🛡️"
              title="Shared ALP vault"
              body="One delta-aware pool underwrites every market and earns funding + liquidation fees."
            />
            <Feature
              icon="📈"
              title="Manipulation-resistant pricing"
              body="Confidence-weighted TWAP oracle with circuit breakers. Thin coins get tighter caps."
            />
            <Feature
              icon="🧮"
              title="Dynamic risk tiers"
              body="Leverage, maintenance margin and position limits scale with on-chain liquidity depth."
            />
            <Feature
              icon="💸"
              title="Continuous funding"
              body="Funding keeps the perp anchored to spot and routes the imbalance to LPs."
            />
            <Feature
              icon="🤖"
              title="Permissionless keepers"
              body="Anyone can liquidate or crank funding and collect a protocol-paid bounty."
            />
          </div>
        </section>

        {/* CTA */}
        <section className="mx-auto max-w-7xl px-5 py-16">
          <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-ink-800 p-10 text-center md:p-16">
            <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-brew-amber/20 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-brew-green/20 blur-3xl" />
            <h2 className="relative text-3xl font-semibold tracking-tight md:text-5xl">
              The trenches finally have <span className="gradient-text">leverage.</span>
            </h2>
            <p className="relative mx-auto mt-4 max-w-xl text-white/60">
              Open the terminal and put on your first position on devnet. No deposit required to look
              around.
            </p>
            <div className="relative mt-8 flex justify-center gap-3">
              <Link href="/trade" className="btn-brew text-base">
                Launch terminal →
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="bg-ink-800 p-5">
      <div className="text-xs uppercase tracking-wider text-white/40">{label}</div>
      <div className={`stat-num mt-1.5 text-2xl ${accent ? 'gradient-text' : ''}`}>{value}</div>
    </div>
  );
}

function SectionHead({ eyebrow, title, sub }: { eyebrow: string; title: string; sub?: string }) {
  return (
    <div className="max-w-2xl">
      <div className="text-sm font-semibold uppercase tracking-wider text-brew-amber">{eyebrow}</div>
      <h2 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">{title}</h2>
      {sub && <p className="mt-3 text-pretty leading-relaxed text-white/60">{sub}</p>}
    </div>
  );
}

function Step({ n, title, body }: { n: string; title: string; body: string }) {
  return (
    <div className="panel-pad relative overflow-hidden">
      <div className="stat-num text-5xl font-bold text-white/[0.06]">{n}</div>
      <h3 className="mt-2 text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-white/55">{body}</p>
    </div>
  );
}

function Feature({ icon, title, body }: { icon: string; title: string; body: string }) {
  return (
    <div className="panel-pad transition-colors hover:border-white/10 hover:bg-ink-700/60">
      <div className="text-2xl">{icon}</div>
      <h3 className="mt-3 font-semibold">{title}</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-white/55">{body}</p>
    </div>
  );
}
