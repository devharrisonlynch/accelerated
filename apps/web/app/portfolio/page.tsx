import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Ticker } from '@/components/ui/Ticker';
import { protocolStats } from '@/lib/markets';
import { fmtPct, fmtUsd } from '@/lib/format';

export default function PortfolioPage() {
  return (
    <>
      <Navbar />
      <Ticker />
      <main className="mx-auto max-w-5xl px-5 py-12">
        <div className="text-sm font-semibold uppercase tracking-wider text-brew-amber">
          ALP Vault
        </div>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">
          Be the house in the trenches.
        </h1>
        <p className="mt-3 max-w-2xl text-white/55">
          The Accelerated Liquidity Provider (ALP) vault is the counterparty to every trade across
          every market. Deposit USDC, receive vault shares, and earn taker fees, funding, and
          liquidation penalties — diversified across thousands of memecoin markets at once.
        </p>

        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          <VaultStat label="Vault TVL" value={fmtUsd(protocolStats.tvl, { compact: true })} />
          <VaultStat label="Trailing 30d APY" value={fmtPct(protocolStats.alpApy * 100, false)} accent />
          <VaultStat label="Utilization" value="62%" />
        </div>

        <div className="mt-8 grid gap-3 md:grid-cols-[1fr_320px]">
          {/* Equity curve placeholder */}
          <div className="panel-pad">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-semibold">Vault share price</h2>
              <span className="chip text-long">{fmtPct(protocolStats.alpApy * 100, false)} APY</span>
            </div>
            <div className="relative h-56 overflow-hidden rounded-lg bg-ink-700/50">
              <svg viewBox="0 0 600 200" className="h-full w-full" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="vaultFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stopColor="#F97316" stopOpacity="0.25" />
                    <stop offset="1" stopColor="#F97316" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path
                  d="M0 170 C 80 160, 120 150, 180 140 S 280 120, 340 100 S 460 70, 520 50 L 600 38 L 600 200 L 0 200 Z"
                  fill="url(#vaultFill)"
                />
                <path
                  d="M0 170 C 80 160, 120 150, 180 140 S 280 120, 340 100 S 460 70, 520 50 L 600 38"
                  fill="none"
                  stroke="#F97316"
                  strokeWidth="2"
                />
              </svg>
            </div>
          </div>

          {/* Deposit card */}
          <div className="panel-pad">
            <h2 className="font-semibold">Provide liquidity</h2>
            <div className="mt-4">
              <div className="mb-1.5 text-xs text-white/50">Deposit amount</div>
              <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-ink-700 px-3 py-2.5">
                <span className="text-white/40">$</span>
                <input
                  type="number"
                  defaultValue={1000}
                  className="w-full bg-transparent font-mono text-lg outline-none"
                />
                <span className="text-xs text-white/40">USDC</span>
              </div>
            </div>
            <dl className="mt-4 space-y-2 text-sm">
              <Row label="You receive" value="≈ 998.4 ALP" />
              <Row label="Share price" value="$1.0162" />
              <Row label="Est. yearly" value={fmtUsd(314, { decimals: 0 })} accent />
            </dl>
            <button className="btn-brew mt-5 w-full">Deposit to vault</button>
            <p className="mt-3 text-center text-[11px] text-white/30">
              Withdrawals subject to vault utilization. Capital is at risk.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

function VaultStat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="panel-pad">
      <div className="text-xs uppercase tracking-wider text-white/40">{label}</div>
      <div className={`stat-num mt-1.5 text-2xl ${accent ? 'gradient-text' : ''}`}>{value}</div>
    </div>
  );
}

function Row({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-white/45">{label}</dt>
      <dd className={`stat-num ${accent ? 'text-brew-green' : 'text-white'}`}>{value}</dd>
    </div>
  );
}
