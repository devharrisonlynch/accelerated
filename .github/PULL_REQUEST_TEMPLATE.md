<!-- Thanks for contributing to Accelerated. Keep PRs small and focused. -->

## What

<!-- A short description of the change. -->

## Why

<!-- Context / linked issue. -->

## Type

- [ ] Program (`programs/accelerated`)
- [ ] SDK (`packages/sdk`)
- [ ] Risk engine (`packages/risk-engine`)
- [ ] Web (`apps/web`)
- [ ] Docs

## Checklist

- [ ] `pnpm lint && pnpm typecheck && pnpm test` pass
- [ ] `anchor test` passes (if program touched)
- [ ] Added/updated tests
- [ ] Added a risk-engine sim (if margin/liquidation math changed)
- [ ] No secrets, keypairs, or `.env` committed

## Risk notes

<!-- For program changes: what's the worst case if this is wrong? Funds at risk? -->
