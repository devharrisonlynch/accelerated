#!/usr/bin/env bash
# Boot a local validator with the Accelerated program deployed and a USDC-like mint ready.
set -euo pipefail

LEDGER_DIR="${LEDGER_DIR:-.test-ledger}"

echo "▸ Building program..."
anchor build

echo "▸ Starting solana-test-validator (ledger: ${LEDGER_DIR})..."
solana-test-validator \
  --reset \
  --quiet \
  --ledger "${LEDGER_DIR}" \
  --bpf-program ACCELeRAtedPRPxxxxxxxxxxxxxxxxxxxxxxxxxxxx target/deploy/accelerated.so &
VALIDATOR_PID=$!
trap 'kill ${VALIDATOR_PID} 2>/dev/null || true' EXIT

echo "▸ Waiting for validator..."
until solana cluster-version -u localhost >/dev/null 2>&1; do sleep 1; done

echo "▸ Airdropping to deployer..."
solana airdrop 100 -u localhost >/dev/null

echo "✓ Localnet up. Program: ACCELeRAtedPRPxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
echo "  Next: pnpm seed:markets"
wait ${VALIDATOR_PID}
