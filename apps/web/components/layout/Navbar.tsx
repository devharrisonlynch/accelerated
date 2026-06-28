import Link from 'next/link';
import { Wordmark } from './Logo';

const NAV = [
  { href: '/trade', label: 'Trade' },
  { href: '/markets', label: 'Markets' },
  { href: '/portfolio', label: 'Vault' },
  { href: 'https://github.com/devharrisonlynch/accelerated', label: 'Docs', external: true },
];

export function Navbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/5 bg-ink/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5">
        <Link href="/" className="transition-opacity hover:opacity-80">
          <Wordmark />
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              target={item.external ? '_blank' : undefined}
              className="rounded-lg px-3.5 py-2 text-sm text-white/70 transition-colors hover:bg-white/5 hover:text-white"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <span className="chip hidden text-brew-green sm:inline-flex">
            <span className="h-1.5 w-1.5 animate-pulse-glow rounded-full bg-brew-green" />
            devnet
          </span>
          <button className="btn-brew text-sm">Connect Wallet</button>
        </div>
      </div>
    </header>
  );
}
