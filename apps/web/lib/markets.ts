// Demo market data. In production these are derived on-chain from graduated Pump.fun mints + the
// oracle adapter; here they seed the terminal UI so the app renders without a live RPC connection.

export type Tier = 'Blue' | 'Green' | 'Amber' | 'Red';

export interface Market {
  symbol: string;
  name: string;
  mint: string;
  price: number;
  change24h: number;
  volume24h: number;
  openInterest: number;
  fundingRate: number; // hourly, as a fraction
  tier: Tier;
  maxLeverage: number;
  liquidity: number;
}

export const TIER_META: Record<Tier, { maxLev: number; mmr: number; color: string; label: string }> = {
  Blue: { maxLev: 5, mmr: 0.08, color: '#38bdf8', label: 'Deep liquidity' },
  Green: { maxLev: 4, mmr: 0.12, color: '#14F195', label: 'Healthy' },
  Amber: { maxLev: 3, mmr: 0.18, color: '#F59E0B', label: 'Thin' },
  Red: { maxLev: 2, mmr: 0.25, color: '#FF4D5E', label: 'Degen' },
};

export const MARKETS: Market[] = [
  { symbol: 'WIFHAT', name: 'dogwifhat clone', mint: 'WiFx9...4Hq2', price: 2.4137, change24h: 18.42, volume24h: 14_200_000, openInterest: 2_900_000, fundingRate: 0.00042, tier: 'Blue', maxLeverage: 5, liquidity: 3_400_000 },
  { symbol: 'PNUT', name: 'Peanut the Squirrel', mint: 'PnuT7...kR1a', price: 0.7821, change24h: -6.13, volume24h: 9_800_000, openInterest: 1_700_000, fundingRate: -0.00018, tier: 'Blue', maxLeverage: 5, liquidity: 2_600_000 },
  { symbol: 'GIGA', name: 'Gigachad', mint: 'GiGa3...mP9x', price: 0.04412, change24h: 42.88, volume24h: 6_400_000, openInterest: 980_000, fundingRate: 0.00091, tier: 'Green', maxLeverage: 4, liquidity: 1_200_000 },
  { symbol: 'MOODENG', name: 'Moo Deng', mint: 'M00dN...8tY4', price: 0.2199, change24h: 9.74, volume24h: 5_100_000, openInterest: 720_000, fundingRate: 0.00033, tier: 'Green', maxLeverage: 4, liquidity: 880_000 },
  { symbol: 'FRACT', name: 'Fractal Cat', mint: 'FrAcT...2wZ7', price: 0.008812, change24h: -22.41, volume24h: 3_300_000, openInterest: 410_000, fundingRate: -0.00067, tier: 'Amber', maxLeverage: 3, liquidity: 340_000 },
  { symbol: 'TROLL', name: 'Troll Face', mint: 'TroLL...9qB3', price: 0.001204, change24h: 121.6, volume24h: 2_900_000, openInterest: 300_000, fundingRate: 0.001, tier: 'Amber', maxLeverage: 3, liquidity: 210_000 },
  { symbol: 'SIGMA', name: 'Sigma Grindset', mint: 'SiGmA...5kL8', price: 0.0003319, change24h: -8.02, volume24h: 1_400_000, openInterest: 120_000, fundingRate: -0.0004, tier: 'Red', maxLeverage: 2, liquidity: 74_000 },
  { symbol: 'COPE', name: 'Maximum Cope', mint: 'CoPe1...3nV6', price: 0.00006641, change24h: 64.3, volume24h: 980_000, openInterest: 88_000, fundingRate: 0.001, tier: 'Red', maxLeverage: 2, liquidity: 41_000 },
];

export const getMarket = (symbol: string) => MARKETS.find((m) => m.symbol === symbol) ?? MARKETS[0];

export const protocolStats = {
  tvl: 9_140_000,
  volume24h: 44_080_000,
  openInterest: 7_300_000,
  markets: MARKETS.length,
  traders: 3_812,
  alpApy: 0.314,
};

// Deterministic pseudo-candles so the chart renders identically on server and client (no hydration
// mismatch, no Math.random). Seeded by the symbol.
export function seededCandles(symbol: string, base: number, count = 120) {
  let seed = [...symbol].reduce((a, c) => a + c.charCodeAt(0), 0);
  const rand = () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };
  const out: { time: number; open: number; high: number; low: number; close: number }[] = [];
  let price = base * 0.82;
  const start = 1_719_792_000; // fixed epoch for SSR stability
  for (let i = 0; i < count; i++) {
    const drift = (rand() - 0.46) * base * 0.04;
    const open = price;
    const close = Math.max(base * 0.0001, open + drift);
    const high = Math.max(open, close) * (1 + rand() * 0.02);
    const low = Math.min(open, close) * (1 - rand() * 0.02);
    out.push({ time: start + i * 3600, open, high, low, close });
    price = close;
  }
  return out;
}
