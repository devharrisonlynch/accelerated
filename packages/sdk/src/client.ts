import { AnchorProvider, BN, Program, type Idl } from '@coral-xyz/anchor';
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddressSync,
} from '@solana/spl-token';
import {
  Connection,
  PublicKey,
  SystemProgram,
  type TransactionInstruction,
} from '@solana/web3.js';
import { PROGRAM_ID } from './constants.js';
import {
  lpMintPda,
  marketPda,
  positionPda,
  protocolPda,
  vaultAuthorityPda,
  vaultCollateralPda,
  vaultPda,
} from './pda.js';
import type { MarketAccount, OpenPositionArgs, PositionAccount, VaultAccount } from './accounts/types.js';

/**
 * Thin, typed wrapper around the Accelerated Anchor program. Construct it with a wallet-bearing
 * provider, then build instructions or fetch decoded accounts.
 *
 * ```ts
 * const client = await AcceleratedClient.connect(provider, IDL);
 * const ix = await client.openPositionIx({ trader, mint, args });
 * ```
 */
export class AcceleratedClient {
  readonly program: Program;

  private constructor(program: Program) {
    this.program = program;
  }

  static connect(provider: AnchorProvider, idl: Idl): AcceleratedClient {
    const program = new Program(idl, provider);
    return new AcceleratedClient(program);
  }

  get connection(): Connection {
    return this.program.provider.connection;
  }

  // ----- account fetchers -----

  async fetchMarket(mint: PublicKey): Promise<MarketAccount> {
    const [market] = marketPda(mint);
    return (await this.program.account.market.fetch(market)) as unknown as MarketAccount;
  }

  async fetchVault(): Promise<VaultAccount> {
    const [vault] = vaultPda();
    return (await this.program.account.vault.fetch(vault)) as unknown as VaultAccount;
  }

  async fetchPosition(market: PublicKey, owner: PublicKey): Promise<PositionAccount | null> {
    const [position] = positionPda(market, owner);
    const info = await this.connection.getAccountInfo(position);
    if (!info) return null;
    return (await this.program.account.position.fetch(position)) as unknown as PositionAccount;
  }

  // ----- instruction builders -----

  async openPositionIx(params: {
    trader: PublicKey;
    mint: PublicKey;
    collateralMint: PublicKey;
    args: OpenPositionArgs;
  }): Promise<TransactionInstruction> {
    const { trader, mint, collateralMint, args } = params;
    const [protocol] = protocolPda();
    const [market] = marketPda(mint);
    const [vault] = vaultPda();
    const [vaultCollateral] = vaultCollateralPda();
    const [position] = positionPda(market, trader);
    const traderUsdc = getAssociatedTokenAddressSync(collateralMint, trader);
    const oracle = (await this.fetchMarket(mint)).oracle;

    return this.program.methods
      .openPosition({
        isLong: args.isLong,
        collateral: new BN(args.collateral.toString()),
        leverageBps: new BN(args.leverageBps.toString()),
        priceLimit: new BN(args.priceLimit.toString()),
      })
      .accounts({
        trader,
        protocol,
        market,
        oracle,
        vault,
        vaultCollateral,
        position,
        traderUsdc,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .instruction();
  }

  async closePositionIx(params: {
    trader: PublicKey;
    mint: PublicKey;
    collateralMint: PublicKey;
  }): Promise<TransactionInstruction> {
    const { trader, mint, collateralMint } = params;
    const [market] = marketPda(mint);
    const [vault] = vaultPda();
    const [vaultAuthority] = vaultAuthorityPda();
    const [vaultCollateral] = vaultCollateralPda();
    const [position] = positionPda(market, trader);
    const traderUsdc = getAssociatedTokenAddressSync(collateralMint, trader);
    const oracle = (await this.fetchMarket(mint)).oracle;

    return this.program.methods
      .closePosition()
      .accounts({
        trader,
        market,
        oracle,
        vault,
        vaultAuthority,
        vaultCollateral,
        position,
        traderUsdc,
        owner: trader,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .instruction();
  }

  async depositLiquidityIx(params: {
    lp: PublicKey;
    collateralMint: PublicKey;
    amount: bigint;
  }): Promise<TransactionInstruction> {
    const { lp, collateralMint, amount } = params;
    const [vault] = vaultPda();
    const [vaultAuthority] = vaultAuthorityPda();
    const [vaultCollateral] = vaultCollateralPda();
    const [lpMint] = lpMintPda();
    const lpUsdc = getAssociatedTokenAddressSync(collateralMint, lp);
    const lpShares = getAssociatedTokenAddressSync(lpMint, lp);

    return this.program.methods
      .depositLiquidity(new BN(amount.toString()))
      .accounts({
        lp,
        vault,
        vaultAuthority,
        vaultCollateral,
        lpMint,
        lpUsdc,
        lpShares,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .instruction();
  }

  // expose the well-known addresses for callers wiring their own transactions
  static addresses() {
    const [protocol] = protocolPda();
    const [vault] = vaultPda();
    const [vaultAuthority] = vaultAuthorityPda();
    const [lpMint] = lpMintPda();
    return { programId: PROGRAM_ID, protocol, vault, vaultAuthority, lpMint };
  }
}

export { ASSOCIATED_TOKEN_PROGRAM_ID };
