/**
 * @accelerated/risk-engine
 *
 * Off-chain risk tooling: assign leverage tiers from a coin's on-chain depth, and simulate the
 * shared vault's solvency under price shocks before committing tier limits on-chain.
 */

export * from './tiers.js';
export * from './simulator.js';
