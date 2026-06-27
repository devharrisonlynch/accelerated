# Security Policy

Accelerated handles leveraged positions and a shared collateral vault. We take security seriously
even at the prototype stage.

## Status

> [!IMPORTANT]
> Accelerated is **unaudited research software**. It has **not** been deployed to mainnet and should
> not be used with real funds. The threat model in [`docs/threat-model.md`](docs/threat-model.md)
> tracks known assumptions and open risks.

## Supported versions

| Version | Supported |
|---------|-----------|
| `0.2.x` (devnet) | ✅ |
| `< 0.2`  | ❌ |

## Reporting a vulnerability

**Do not open a public issue for security bugs.**

Email `security@accelerated.example` with:

- A description of the issue and its impact (funds at risk, DoS, oracle manipulation, etc.).
- Reproduction steps or a PoC against localnet/devnet.
- Any suggested remediation.

We aim to acknowledge within 48 hours and to provide a remediation timeline within 5 business days.

## Scope

In scope:

- The Anchor program in `programs/accelerated` (margin math, liquidation, vault accounting, oracle
  adapter, access control).
- The SDK's instruction construction where it could cause incorrect on-chain state.

Out of scope:

- The web frontend's cosmetic issues.
- Third-party dependencies (report upstream).
- Anything requiring a compromised validator or oracle signing key.

## Bug bounty

A formal bounty program will launch alongside the first audit. Until then, responsible disclosures
are credited in release notes.
