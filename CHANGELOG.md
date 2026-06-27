# Changelog

All notable changes to Accelerated are documented here. Format loosely follows
[Keep a Changelog](https://keepachangelog.com/).

## [0.2.0] — Unreleased (devnet)

### Added
- Core Anchor program: protocol + shared ALP vault, market listing, open/close, liquidation,
  permissionless funding crank.
- Confidence-weighted oracle adapter with staleness, confidence, and conservative-marking guards.
- Off-chain risk engine: liquidity-based leverage tiers + deterministic vault solvency simulator.
- Typed TypeScript SDK (`@accelerated/sdk`): PDA derivation, instruction builders, account decoders,
  margin math mirror.
- Next.js trading terminal: landing page, trade terminal (chart + leverage order panel + positions),
  markets, and ALP vault pages.
- Docs: architecture, risk engine, oracle design, lite paper, threat model.
- CI for both the web/packages workspace and the Anchor program.

### Notes
- Unaudited. Devnet only. Not for mainnet use.

## [0.1.0]
- Initial private prototype (margin math spike, no UI).
