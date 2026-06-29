# @accelerated/web

The Accelerated trading terminal — a Next.js 14 (App Router) app for leverage-trading graduated
Pump.fun coins.

## Routes

| Route | Purpose |
|-------|---------|
| `/` | Landing page — hero, protocol stats, live ticker, market preview. |
| `/trade` | Trading terminal — chart, order panel with leverage slider, positions. |
| `/markets` | Full market list grouped by risk tier. |
| `/portfolio` | ALP vault — provide liquidity, view share price. |

## Stack

- **Next.js 14** App Router + React 18 (server components by default, `'use client'` only where
  interactive).
- **Tailwind CSS** with a custom "trench terminal" design system (see `app/globals.css` and
  `tailwind.config.ts`).
- **lightweight-charts** for candlestick charts (dynamically imported, client-only).
- **@solana/wallet-adapter** for wallet connections.
- **@accelerated/sdk** for building and decoding on-chain instructions.

## Develop

```bash
pnpm --filter @accelerated/web dev      # http://localhost:3000
pnpm --filter @accelerated/web build
pnpm --filter @accelerated/web typecheck
```

## Notes

The terminal ships with deterministic demo market data (`lib/markets.ts`) so it renders without a
live RPC connection. Candles are seeded by symbol to avoid SSR hydration mismatches. Wire
`@accelerated/sdk` to a devnet RPC to replace the demo data with on-chain state.
