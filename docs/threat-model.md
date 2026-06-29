# Threat Model

What Accelerated trusts, what it doesn't, and how each attack surface is mitigated. This is a living
document for a prototype — it tracks assumptions, not guarantees.

## Trust assumptions

| We trust | We do **not** trust |
|----------|---------------------|
| The Pyth oracle network's signed prices (within a confidence band). | The underlying AMM spot price. |
| The Solana runtime (rent, PDAs, CPI). | Any single keeper or LP. |
| The admin authority **only** for listing markets and tuning params. | The admin with custody of user funds (they have none). |

## Attack surface & mitigations

### 1. Oracle manipulation
*Goal: mint fake PnL by moving the reference price.*

- We never read AMM spot — only a Pyth feed.
- Staleness (≤60s), confidence cap (tier-dependent), and conservative marking reject or penalize
  dislocated prices. Liquidations use mid; the penalty covers slippage.
- **Residual risk:** a compromised oracle signing key. Out of scope; mitigated long-term by TWAP +
  AMM sanity-band cross-checks.

### 2. Vault draining via large positions
*Goal: open an un-hedgeable position the vault can't survive.*

- Per-market `max_position` and `max_oi_per_side` caps, sized by solvency simulation.
- Tiered leverage and maintenance margins scale risk down with illiquidity.
- Withdrawals blocked above `max_utilization_bps`, so LPs can't pull backing out from under open
  positions.

### 3. Liquidation games
*Goal: avoid liquidation, or liquidate healthy positions.*

- `liquidate` recomputes the margin ratio from the live oracle and requires it ≤ maintenance, else
  `PositionHealthy`. A healthy position cannot be liquidated.
- Bounty + insurance cut are bounded by available equity, so liquidation can't over-pay.

### 4. Funding manipulation
*Goal: distort funding to extract value.*

- Rate is bounded to ±0.1%/hr and derived from on-chain skew, not a quotable input.
- Crank is permissionless but interval-gated and prorated (capped at 24 intervals).

### 5. Arithmetic / state corruption
- All math is checked fixed-point; overflow returns a program error, never a trap or wrap.
- Vault accounting enforces `reserved ≤ total_assets` and never pays beyond assets + insurance.
- PDA seeds bind positions to `(market, owner)`; `has_one`/address constraints guard every account.

### 6. Admin abuse
- Admin can pause and tune parameters but has **no path to user collateral** — payouts only flow via
  the vault-authority PDA under program logic.
- Two-step authority transfer (`pending_authority`) guards against fat-fingered handoff.
- Long-term: move admin to a timelocked multisig / governance.

## Known open risks

- Unaudited. Margin/liquidation edge cases need formal review and fuzzing (proptest harness stubbed).
- Single-tick oracle (no TWAP yet) is more manipulable than the target design.
- Insurance fund is bootstrapped, not yet backed by an on-chain auction mechanism.
- No cross-margin — isolated only — so capital efficiency is limited (by design, for safety).

Report anything that could affect funds via [SECURITY.md](../SECURITY.md), not a public issue.
