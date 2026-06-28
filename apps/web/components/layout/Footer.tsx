import Link from 'next/link';
import { Wordmark } from './Logo';

export function Footer() {
  return (
    <footer className="border-t border-white/5 bg-ink/40">
      <div className="mx-auto max-w-7xl px-5 py-12">
        <div className="flex flex-col justify-between gap-10 md:flex-row">
          <div className="max-w-sm">
            <Wordmark />
            <p className="mt-4 text-sm leading-relaxed text-white/50">
              Permissionless perpetuals for the long tail of Solana memecoins. Leverage every
              graduated Pump.fun coin up to 5×, backed by a single shared liquidity vault.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-10 sm:grid-cols-3">
            <FooterCol
              title="Protocol"
              links={[
                ['Trade', '/trade'],
                ['Markets', '/markets'],
                ['ALP Vault', '/portfolio'],
              ]}
            />
            <FooterCol
              title="Developers"
              links={[
                ['GitHub', '#'],
                ['SDK', '#'],
                ['Risk engine', '#'],
              ]}
            />
            <FooterCol
              title="Community"
              links={[
                ['X / Twitter', '#'],
                ['Discord', '#'],
                ['Whitepaper', '#'],
              ]}
            />
          </div>
        </div>

        <div className="mt-10 flex flex-col items-start justify-between gap-4 border-t border-white/5 pt-6 text-xs text-white/40 sm:flex-row sm:items-center">
          <p>© 2025 Accelerated contributors · AGPL-3.0 · Unaudited research software.</p>
          <p className="max-w-md text-right">
            Leverage trading is extremely high-risk. Not financial advice. You can lose 100% of your
            collateral.
          </p>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <div>
      <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-white/40">{title}</h4>
      <ul className="space-y-2.5">
        {links.map(([label, href]) => (
          <li key={label}>
            <Link href={href} className="text-sm text-white/60 transition-colors hover:text-white">
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
