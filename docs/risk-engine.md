# Risk Engine

The risk engine decides *how much* leverage a coin can safely support and proves the shared vault
stays solvent under that exposure. It runs off-chain (see [`packages/risk-engine`](../packages/risk-engine))
and commits parameters the on-chain program then enforces.

## Leverage tiers

Leverage is not a flat 5× everywhere. A coin with $40K of liquidity cannot support the same risk as
one with $3M, because the vault can't hedge a large position in a pool that thin. Each market is
bucketed into a tier by on-chain depth:

| Tier | Liquidity | Max leverage | Maintenance margin | Max position | Max OI / side | Oracle conf cap |
|------|-----------|--------------|--------------------|--------------|---------------|-----------------|
| **Blue**  | > $2M       | 5.0× | 8%  | $50,000 | $1.5M | 40 bps |
| **Green** | $500K–$2M   | 4.0× | 12% | $20,000 | $600K | 80 bps |
| **Amber** | $100K–$500K | 3.0× | 18% | $7,500  | $200K | 150 bps |
| **Red**   | $30K–$100K  | 2.0× | 25% | $2,000  | $60K  | 250 bps |

### Safety demotions

Base tier comes from liquidity, then the engine **demotes** (never promotes) on red flags:

- **Fresh graduation** (< 6h old) → capped at **Red**. New coins are the most reflexive and the
  oracle history is shortest.
- **Wide oracle band** (confidence > 1% of price) → capped at **Amber**.
- **Thin volume** (24h volume < 10% of liquidity) → capped at **Amber**. A deep-but-dead pool is
  fragile.

Tiers are recomputed every funding interval, so a coin can be promoted as it matures and gains
depth, or demoted as liquidity drains.

## Maintenance margin & liquidation

A position is liquidatable when its **margin ratio** falls to or below the tier's maintenance
requirement:

```
equity        = collateral + unrealized_pnl − funding_owed
margin_ratio  = equity / notional
liquidatable  ⇔ margin_ratio ≤ maintenance_margin
```

Higher tiers (thinner coins) demand a fatter maintenance buffer so the vault has more room to close
a position before it goes underwater in an illiquid market.

The **liquidation price** is surfaced to traders at open time:

```
long:  liq = entry − (collateral_after_fee − maintenance) / size
short: liq = entry + (collateral_after_fee − maintenance) / size
```

## Vault solvency model

The vault is the counterparty to *net* trader open interest. A price shock `r` on a market moves the
vault's PnL by `−sign(netOi) · min(|netOi|, oi_cap) · r`. The simulator
([`simulator.ts`](../packages/risk-engine/src/simulator.ts)) samples many shock scenarios across all
markets and reports:

- **Insolvency probability** — fraction of scenarios where `vault + insurance + pnl < 0`.
- **Worst drawdown** — the single worst vault loss observed.
- **Mean PnL** — expected vault outcome (positive, since LPs earn the edge).

Tier OI caps are tuned so that, at the configured vault size, simulated insolvency probability stays
well below target even under correlated 60% shocks across every market. The simulation is
deterministic given a seed, so the chosen limits are reproducible and auditable in CI.

## Funding

Funding keeps the perp anchored to spot and compensates the vault for directional exposure:

```
rate = clamp( skew / total_oi · k , ±0.1%/hr )
```

where `skew = long_oi − short_oi`. When a market is long-heavy, longs pay shorts (and the imbalance
accrues to the vault); when short-heavy, the reverse. The crank is permissionless and prorated by
elapsed intervals (capped at 24) so a market can't accrue runaway funding after downtime.
