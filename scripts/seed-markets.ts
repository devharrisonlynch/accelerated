/**
 * Seed a local validator with a handful of mock "graduated" coins so the terminal has something to
 * trade. Creates an SPL mint + MockPriceFeed per coin, then lists each as a Accelerated market with
 * a tier from the risk engine.
 *
 *   pnpm seed:markets
 */

import * as anchor from '@coral-xyz/anchor';
import { Keypair } from '@solana/web3.js';
import { assignTier } from '@accelerated/risk-engine';

interface SeedCoin {
  symbol: string;
  price: number;
  liquidityUsd: number;
  volume24hUsd: number;
  ageHours: number;
}

const COINS: SeedCoin[] = [
  { symbol: 'WIFHAT', price: 2.4137, liquidityUsd: 3_400_000, volume24hUsd: 14_200_000, ageHours: 240 },
  { symbol: 'PNUT', price: 0.7821, liquidityUsd: 2_600_000, volume24hUsd: 9_800_000, ageHours: 180 },
  { symbol: 'GIGA', price: 0.04412, liquidityUsd: 1_200_000, volume24hUsd: 6_400_000, ageHours: 90 },
  { symbol: 'MOODENG', price: 0.2199, liquidityUsd: 880_000, volume24hUsd: 5_100_000, ageHours: 72 },
  { symbol: 'FRACT', price: 0.008812, liquidityUsd: 340_000, volume24hUsd: 3_300_000, ageHours: 30 },
  { symbol: 'SIGMA', price: 0.0003319, liquidityUsd: 74_000, volume24hUsd: 1_400_000, ageHours: 12 },
];

async function main() {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  console.log(`▸ Seeding ${COINS.length} markets on ${provider.connection.rpcEndpoint}\n`);

  for (const coin of COINS) {
    const tier = assignTier({
      liquidityUsd: coin.liquidityUsd,
      volume24hUsd: coin.volume24hUsd,
      ageSeconds: coin.ageHours * 3_600,
      oracleConfidence: 0.003,
    });

    // In the full script: create the SPL mint, init a MockPriceFeed with `coin.price`, and call
    // initialize_market with the tier params below. Stubbed to keep the example focused.
    const mint = Keypair.generate();

    console.log(
      `  ${coin.symbol.padEnd(8)} → ${tier.tier.padEnd(5)} ` +
        `${tier.maxLeverage}x · mm ${(tier.maintenanceMarginBps / 100).toFixed(0)}% · ` +
        `maxPos $${tier.maxPositionUsd.toLocaleString()} · mint ${mint.publicKey.toBase58().slice(0, 8)}…`,
    );
  }

  console.log('\n✓ Done. Launch the terminal: pnpm --filter @accelerated/web dev');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
