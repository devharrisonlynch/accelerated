# @accelerated/sdk

Typed TypeScript client for the [Accelerated](../../README.md) perpetuals program.

## Install

```bash
pnpm add @accelerated/sdk @solana/web3.js @coral-xyz/anchor
```

## Usage

```ts
import { AnchorProvider } from '@coral-xyz/anchor';
import { PublicKey } from '@solana/web3.js';
import { AcceleratedClient, quotePosition } from '@accelerated/sdk';
import IDL from './accelerated.json' assert { type: 'json' };

const client = AcceleratedClient.connect(provider, IDL);

// Quote a 5x long on WIFHAT before sending anything on-chain
const q = quotePosition({
  collateral: 100,
  leverage: 5,
  price: 2.41,
  isLong: true,
  tier: 'Blue',
});
console.log(q.liquidationPrice, q.notional, q.fee);

// Build the open-position instruction
const ix = await client.openPositionIx({
  trader,
  mint: new PublicKey('WiF...'),
  collateralMint: USDC_MINT,
  args: {
    isLong: true,
    collateral: 100_000_000n, // 100 USDC
    leverageBps: 50_000n, // 5x
    priceLimit: 2_500_000n, // max entry 2.50
  },
});
```

## What's inside

| Module | Purpose |
|--------|---------|
| `constants` | Program id, fixed-point precisions, tier parameters. |
| `pda` | Derive every protocol PDA (protocol, vault, market, position…). |
| `client` | `AcceleratedClient` — fetch decoded accounts, build instructions. |
| `accounts/types` | TS interfaces mirroring on-chain accounts. |
| `math/margin` | Floating-point mirror of the on-chain margin math for instant quoting. |

The margin math here is a faithful mirror of `programs/accelerated/src/utils/margin.rs`. The chain is
always the source of truth; the SDK math is for previews and UI.
