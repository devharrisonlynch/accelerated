# Oracle Design

Accelerated's single most important safety property is that it **never prices a position off a thin
AMM spot pool**. A memecoin pool with $40K of liquidity can be moved 50% with a few thousand dollars
inside one block — pricing leverage off that is an invitation to be drained. Instead every market
references a price feed and the program validates it before trusting a number.

## Sources

| Environment | Source |
|-------------|--------|
| Mainnet | Pyth pull oracle (`pyth-solana-receiver-sdk`) for the coin's USD price. |
| Devnet | Pyth devnet feeds, cloned into the local validator (see `Anchor.toml`). |
| Localnet | `MockPriceFeed` account the test harness writes directly. |

All three flow through the **same** `validate_and_scale` path
([`utils/oracle.rs`](../programs/accelerated/src/utils/oracle.rs)), so swapping the source changes
nothing downstream.

## Validation guards

Before a price is used to open, close, or liquidate, it must pass:

1. **Positivity** — `price > 0`, else `InvalidOraclePrice`.
2. **Staleness** — `now − published_at ≤ 60s`, else `StaleOracle`. A stale feed halts trading on
   that market rather than pricing off a frozen number.
3. **Confidence** — the feed's confidence interval, as a fraction of price, must be below the
   market's `max_confidence_bps`. Thinner tiers demand a tighter band (Blue 40 bps → Red 250 bps).
   A blown-out confidence interval (e.g. during a violent move) rejects the trade with
   `OracleConfidenceTooWide`.

The validated reading is scaled into the protocol's `PRICE_PRECISION` (1e6) fixed-point regardless
of the feed's native exponent.

## Conservative marking

To keep the vault solvent under noisy feeds, the program marks against the side of the confidence
band that *disfavors the trader*:

| Action | Long | Short |
|--------|------|-------|
| **Open** | low end (`price − conf`) | high end (`price + conf`) |
| **Close** | high end | low end |

This means a trader can never open at an artificially favorable tick or exit at an inflated one; the
spread accrues as a safety margin to LPs. Liquidations use the **mid** price — the liquidation
penalty already covers execution slippage.

## Circuit breakers

- **Per-market pause** — admin (or, in a future version, an automated guardian) can pause a market
  whose feed is misbehaving; only closes and liquidations remain enabled.
- **Confidence cap** — doubles as a volatility breaker: during a feed dislocation the band widens
  and new opens are automatically rejected until it tightens.
- **Funding proration cap** — after downtime, accrued funding is capped at 24 intervals so a market
  can't snap to an extreme cumulative value.

## Future work

- Confidence-weighted **TWAP** over a rolling window (vs. the latest tick) to further blunt
  single-block manipulation.
- Cross-checking the oracle against a sanity band derived from the AMM TWAP, rejecting prices that
  diverge beyond a tier-dependent threshold.
