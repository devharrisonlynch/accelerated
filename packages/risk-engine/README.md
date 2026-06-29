# @accelerated/risk-engine

Off-chain risk tooling for Accelerated markets.

It does two jobs:

1. **Tier assignment** (`assignTier`) — bucket a graduated coin into a leverage tier (`Blue` → `Red`)
   from its on-chain liquidity, age, volume, and oracle confidence. The on-chain program enforces
   whatever tier the engine commits.
2. **Vault solvency simulation** (`simulateVault`) — stress the shared ALP vault against price
   shocks across all open markets to estimate insolvency probability before tuning tier limits.

```ts
import { assignTier, simulateVault } from '@accelerated/risk-engine';

const cfg = assignTier({
  liquidityUsd: 2_400_000,
  volume24hUsd: 3_100_000,
  ageSeconds: 86_400,
  oracleConfidence: 0.003,
});
// → { tier: 'Blue', maxLeverage: 5, maintenanceMarginBps: 800, ... }

const risk = simulateVault({
  vaultUsd: 9_000_000,
  insuranceFundUsd: 500_000,
  markets: [{ tier: 'Blue', netOiUsd: 1_200_000 }],
  trials: 10_000,
  maxShock: 0.6,
  seed: 1,
});
// → { insolvencyProb: 0.0, worstDrawdownUsd: -..., ... }
```

The simulator is deterministic given a `seed` (it uses an LCG, not `Math.random`) so CI runs are
reproducible. See [`docs/risk-engine.md`](../../docs/risk-engine.md) for the model write-up.
