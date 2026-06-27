# Contributing to Accelerated

Thanks for your interest in building the trenches' derivatives layer. This document explains how to
get a dev environment running and what we expect from a contribution.

## Ground rules

- **Safety first.** This program moves (simulated) collateral. Any change to `programs/accelerated`
  must keep `anchor test` green and include a risk-engine sim where margin math is touched.
- **Small, reviewable PRs.** One concern per pull request.
- **No mainnet deploys from PRs.** Devnet / localnet only.

## Development setup

```bash
# Toolchain
rustup install 1.79.0
solana-install init 1.18.17
cargo install --git https://github.com/coral-xyz/anchor avm --locked
avm install 0.30.1 && avm use 0.30.1

# Repo
pnpm install
anchor build
anchor test
```

## Project layout

| Path | What lives here |
|------|-----------------|
| `programs/accelerated` | The on-chain Anchor program. |
| `packages/sdk` | Typed TS client. Regenerate IDL types after program changes with `pnpm --filter @accelerated/sdk gen`. |
| `packages/risk-engine` | Off-chain margin/leverage simulator used in tests and the UI. |
| `apps/web` | Next.js trading terminal. |
| `docs` | Design notes, whitepaper, threat model. |

## Workflow

1. Fork & branch from `main` (`feat/…`, `fix/…`, `docs/…`).
2. Make your change. Add or update tests.
3. Run the full gate locally:
   ```bash
   pnpm lint && pnpm typecheck && pnpm test && anchor test
   ```
4. Open a PR. Fill in the template. Link any related issue.
5. A maintainer reviews. On-chain changes get a second review.

## Commit style

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
feat(program): add isolated-margin position mode
fix(sdk): correct liquidation-price rounding
docs(risk): clarify amber-tier maintenance margin
```

## Reporting bugs

Open an issue with reproduction steps. For anything that could affect funds, follow
[`SECURITY.md`](SECURITY.md) instead of filing a public issue.
