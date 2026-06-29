# Accelerated — Leverage for the Long Tail

*A lite paper. v0.2 · research draft.*

> [!WARNING]
> This document describes a research prototype. It is not an offer, solicitation, or financial
> advice. Leverage trading of low-liquidity assets is extremely high-risk.

## 1. The gap

Pump.fun turned memecoin issuance into a firehose. Thousands of tokens graduate, generating enormous
**spot** volume in what the community calls the "trenches." Yet the trenches have **no derivatives
layer**:

- You cannot **short** a coin you're confident is a rug.
- You cannot **lever** a conviction play without buying spot and accepting full downside.
- You cannot **hedge** a bag you're not ready to sell.

The obvious approaches don't work here. A per-token vAMM (Drift-style) or order book needs each
market to bootstrap dedicated liquidity. Trench coins graduate and die in hours — that liquidity
never forms, and even if it did, it would be far too thin to price leverage against safely.

## 2. The idea

**Price synthetically, pool the risk.** Accelerated lets a trader post USDC collateral and take a
directional position that settles against a **manipulation-resistant oracle**, not the underlying
pool. All positions across all markets share **one liquidity vault** as their counterparty.

Two consequences fall out:

1. A coin needs **zero dedicated liquidity** to become leverage-tradable — only a price feed. It can
   be listed the moment it graduates.
2. The vault's risk is **diversified across thousands of uncorrelated-ish memecoins** and bounded
   per market by tiered position/OI caps.

## 3. Mechanism

- **Markets.** One per graduated mint, referencing a Pyth feed. Synthetic — no memecoin is custodied.
- **Collateral.** USDC, isolated per position (cross-margin is on the roadmap).
- **Leverage.** Up to 5×, scaled down per coin by the [risk engine](risk-engine.md) (Blue 5× → Red 2×).
- **ALP vault.** LPs deposit USDC for shares; the vault is the counterparty and earns taker fees,
  funding, and liquidation penalties. Losses hit an insurance fund before LPs.
- **Funding.** Continuous, skew-driven, anchors the perp to spot and pays the vault for its exposure.
- **Keepers.** Permissionless liquidation and funding cranks, paid bounties.

## 4. Why it stays solvent

The protocol's job is to make sure the vault is **never** on the wrong side of an un-hedgeable
position:

- **Oracle guards** (staleness, confidence, conservative marking) stop single-block manipulation
  from minting fake PnL. See [oracle.md](oracle.md).
- **Tiered caps** keep any one thin coin's contribution to vault risk small, sized by Monte-Carlo
  solvency simulation. See [risk-engine.md](risk-engine.md).
- **Maintenance margins** scale with illiquidity, giving keepers room to close before a position
  goes underwater.
- **Insurance fund + socialized loss** as the final backstop, never silent insolvency.

## 5. Economics

- **Traders** get the first venue to lever or short the long tail.
- **LPs** get a diversified, fee-earning position as "the house" across the entire trench, instead of
  picking individual coins.
- **Keepers** get a permissionless bounty stream.
- **The protocol** takes a small taker fee, most of which routes to LPs and the insurance fund.

## 6. Roadmap

Core program → oracle adapter → terminal (done, devnet) → keeper SDK → cross-margin → on-chain
insurance auctions → audited, gated mainnet beta.

## 7. Disclaimer

Accelerated is unaudited research software. Most leveraged memecoin positions lose money. You can
lose 100% of your collateral in a single block. Nothing here is financial advice.
