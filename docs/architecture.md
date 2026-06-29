# Architecture

Accelerated is a single Anchor program plus a shared liquidity vault. There is no per-market AMM and
no order book. Traders take synthetic, oracle-settled positions against one pooled counterparty.

## Components

```
┌─────────────────────────────────────────────────────────────────────┐
│                          Accelerated program                          │
│                                                                       │
│  Protocol ──── Vault (ALP) ─────────────────┐                         │
│  (config,      (USDC, shares, reserved,      │  one vault backs       │
│   kill switch)  insurance fund)              │  every market          │
│                                              ▼                         │
│  Market[WIF] ── Market[PNUT] ── Market[GIGA] ── … ── Market[COPE]      │
│      │              │              │                     │             │
│   Position[..]   Position[..]   Position[..]          Position[..]     │
└─────────────────────────────────────────────────────────────────────┘
        ▲                    ▲                       ▲
   Pyth / oracle        keepers (liquidate,     LPs (deposit /
   adapter              crank funding)          withdraw)
```

## Account model

| Account | PDA seeds | Holds |
|---------|-----------|-------|
| `Protocol` | `["protocol"]` | Admin authority, collateral mint, kill switch, fee. |
| `Vault` | `["vault"]` | Total assets/shares, reserved collateral, insurance fund, utilization cap. |
| `Vault authority` | `["vault_authority"]` | PDA that signs vault token transfers and mints. |
| `Market` | `["market", mint]` | Oracle ref, tier, OI, funding accumulators, limits. |
| `Position` | `["position", market, owner]` | Direction, size, collateral, entry price, funding snapshot. |

All collateral and settlement is in **USDC**. Markets reference an existing SPL `mint`; they never
custody the memecoin itself — exposure is fully synthetic.

## Why synthetic, shared-vault?

A per-token vAMM or order book needs each market to bootstrap its own liquidity. In the trenches,
coins graduate and die in hours; that liquidity never forms. Accelerated instead:

- Prices every position off a **manipulation-resistant oracle**, not the thin spot pool.
- Routes all PnL through **one shared vault**, so a new coin is tradable with *zero* dedicated
  liquidity the moment it graduates.
- Bounds the vault's exposure per market with **tiered OI and position caps** sized by the
  off-chain [risk engine](risk-engine.md).

## Instruction flows

### Open a position

```
trader
  │  open_position(is_long, collateral, leverage_bps, price_limit)
  ▼
1. checks: protocol/market not paused, collateral ≥ min, leverage ≤ tier cap ≤ 5x
2. oracle: read + validate (staleness, confidence), pick conservative entry price
3. size:  notional = (collateral − fee) × leverage ; base_size = notional / price
4. limits: notional ≤ max_position ; new OI ≤ max_oi_per_side
5. vault:  pull USDC, reserve (collateral − fee), credit fee to LPs
6. write Position PDA with funding snapshot
```

### Close a position

```
trader → close_position
  1. read + validate oracle, mark at the conservative exit price
  2. funding_owed = (cum_funding − snapshot) × size
  3. pnl = size × (mark − entry) [long] ; equity = collateral + pnl − funding
  4. settle with vault (profit debits vault / loss credits it), release reserve
  5. pay trader equity, close PDA (rent refunded)
```

### Liquidate (permissionless)

```
keeper → liquidate
  1. compute margin ratio at mark; require ≤ maintenance margin
  2. keeper bounty = 1.5% of notional ; insurance cut = 0.5%
  3. vault absorbs trader loss, pays keeper, routes insurance, returns residual
```

### Crank funding (permissionless)

```
keeper → crank_funding
  1. require funding interval elapsed
  2. rate = f(skew / total_oi), bounded to ±0.1%/hr
  3. advance cumulative_funding_long / _short; longs pay shorts when long-heavy
```

## Solvency invariants

- The vault never pays out more than `total_assets`; any shortfall draws the **insurance fund**
  first, and only then is socialized.
- `reserved ≤ total_assets` always; LP withdrawals cannot push utilization past `max_utilization_bps`.
- Every arithmetic op is checked fixed-point (`utils::math`); overflow returns an error, never a trap.

See [`risk-engine.md`](risk-engine.md) for how tier limits keep these invariants comfortable, and
[`oracle.md`](oracle.md) for the pricing guards.
