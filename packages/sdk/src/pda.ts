import { PublicKey } from '@solana/web3.js';
import { PROGRAM_ID, SEEDS } from './constants.js';

const find = (seeds: (Buffer | Uint8Array)[], programId = PROGRAM_ID) =>
  PublicKey.findProgramAddressSync(seeds, programId);

export const protocolPda = () => find([SEEDS.protocol]);
export const vaultPda = () => find([SEEDS.vault]);
export const vaultAuthorityPda = () => find([SEEDS.vaultAuthority]);
export const vaultCollateralPda = () => find([SEEDS.vault, Buffer.from('collateral')]);
export const lpMintPda = () => find([SEEDS.lpMint]);

export const marketPda = (mint: PublicKey) => find([SEEDS.market, mint.toBuffer()]);

export const positionPda = (market: PublicKey, owner: PublicKey) =>
  find([SEEDS.position, market.toBuffer(), owner.toBuffer()]);
