import type { ActionHash, AppClient } from "@holochain/client";
import type { PublicKey as SolanaPublicKey } from "@solana/web3.js";
import {
  PingCoordinator,
  UsernameAttestation,
  UsernameRegistryCoordinator,
  WalletAttestation,
} from "@holoom/types";
import { BoundWallet } from "./types";
import { decodeAppEntry, formatEvmSignature, retryUntilIf } from "./utils";
import {
  getAddress as checksumCaseAddress,
  bytesToHex,
  hexToBytes,
  Hex,
} from "viem";
import bs58 from "bs58";
import { EvmBytesSignatureRequestorClient } from "./evm-bytes-signature-requestor-client";

/**
 * This client is intended to be the primary and most convenient method of
 * interaction for apps built on the holoom platform. It provides tools for:
 * - Username registration and attestation with an authority
 * - Management of a metadata for an agent
 * - Binding Solana and Ethereum wallets to the user's AgentPubKey
 */
export class HoloomClient {
  private usernameRegistryCoordinator: UsernameRegistryCoordinator;
  private pingCoordinator: PingCoordinator;
  constructor(private appClient: AppClient) {
    this.usernameRegistryCoordinator = new UsernameRegistryCoordinator(
      appClient
    );
    this.pingCoordinator = new PingCoordinator(appClient);
  }

  /**
   * Returns a promise that resolves once the holoom happ is loaded and ready
   * to use.
   */
  async untilReady(interval = 1000, timeout = 30_000) {
    const start = Date.now();
    while (Date.now() - start < timeout) {
      try {
        await this.pingCoordinator.ping();
        return;
      } catch {
        await new Promise((r) => setTimeout(r, interval));
      }
    }
    throw new Error("HoloomClient.untilReady timed out");
  }

  /**
   * Returns the user's username if they have registered one.
   *
   * Returning `null` doesn't guarantee that the user has never registered, as
   * this can also happen if the holochain conductor hasn't yet received gossip
   * of an existing registration - this is likely to happen when switching
   * hosts on the holo network.
   */
  async getUsername(): Promise<string | null> {
    const record =
      await this.usernameRegistryCoordinator.getUsernameAttestationForAgent(
        this.appClient.myPubKey
      );
    if (!record) {
      return null;
    }
    const entry = decodeAppEntry<UsernameAttestation>(record);

    return entry.username;
  }

  /**
   * Submits a username for registration.
   *
   * The user's conductor will sign the username and submit it to the authority
   * agent, which checks the signature and attests the username's uniqueness.
   */
  async registerUsername(username: string) {
    await this.usernameRegistryCoordinator.signUsernameToAttest(username);
  }

  /**
   * Sets a value for an item in the user's metadata key-value store.
   *
   * Each user has a public freeform (i.e. without specific validation)
   * string-to-string K-V store, where K-V pairs are encoded into link tags
   * on the agent in question.
   */
  async setMetadata(name: string, value: string) {
    await this.usernameRegistryCoordinator.updateMetadataItem({
      agent_pubkey: this.appClient.myPubKey,
      name,
      value,
    });
  }

  /**
   * Retrieves the latest value (if any) of an item in the user's metadata K-V
   * store.
   *
   * It is possible for this value to be stale (or `null`) if the agent's
   * conductor hasn't received gossip of the latest information - this is
   * likely to happen when switching hosts on the holo network.
   */
  async getMetadata(name: string) {
    const value = await this.usernameRegistryCoordinator.getMetadataItemValue({
      agent_pubkey: this.appClient.myPubKey,
      name,
    });
    if (!value) return null;
    return value;
  }

  /**
   * Retrieves a message to be signed by the specified EVM wallet in order to
   * bind it to the user's agent.
   *
   * This signing message includes the agent's chain head and thus becomes
   * stale if the user performs another action that progresses their chain
   * before first submitting their binding signature.
   */
  async getEvmWalletBindingMessage(evmAddress: Hex) {
    const message =
      await this.usernameRegistryCoordinator.getEvmWalletBindingMessage(
        hexToBytes(evmAddress)
      );
    return message;
  }

  /**
   * Creates a verifiable entry that shows that the user has control over the
   * specified EVM wallet.
   *
   * The provided signature must be over the current binding message - see
   * `getEvmWalletBindingMessage`.
   */
  async submitEvmWalletBinding(evmAddress: Hex, evmSignature: Hex) {
    await this.usernameRegistryCoordinator.attestWalletSignature({
      Evm: {
        evm_address: hexToBytes(evmAddress),
        evm_signature: formatEvmSignature(evmSignature),
      },
    });
  }

  /**
   * Retrieves a message to be signed by the specified Solana wallet in order
   * to bind it to the user's agent.
   *
   * This signing message includes the agent's chain head and thus becomes
   * stale if the user performs another action that progresses their chain
   * before first submitting their binding signature.
   */
  async getSolanaWalletBindingMessage(solanaPublicKey: SolanaPublicKey) {
    const message =
      await this.usernameRegistryCoordinator.getSolanaWalletBindingMessage(
        solanaPublicKey.toBytes()
      );
    return message;
  }

  /**
   * Creates a verifiable entry that shows that the user has control over the
   * specified Solana wallet.
   *
   * The provided signature must be over the current binding message - see
   * `getSolanaWalletBindingMessage`.
   */
  async submitSolanaWalletBinding(
    solanaPublicKey: SolanaPublicKey,
    solanaSignature: Uint8Array
  ) {
    await this.usernameRegistryCoordinator.attestWalletSignature({
      Solana: {
        solana_address: solanaPublicKey.toBytes(),
        solana_signature: Array.from(solanaSignature),
      },
    });
  }

  /**
   * Retrieves an array of all EVM and Solana addresses under the user's control.
   *
   * It is possible for this information to be stale if the agent's conductor
   * hasn't received gossip of the latest information - this is likely to
   * happen when switching hosts on the holo network.
   */
  async getBoundWallets(): Promise<BoundWallet[]> {
    const records =
      await this.usernameRegistryCoordinator.getWalletAttestationsForAgent(
        this.appClient.myPubKey
      );

    return records.map((record) => {
      const entry = decodeAppEntry<WalletAttestation>(record);
      if ("Evm" in entry.chain_wallet_signature) {
        const { evm_address } = entry.chain_wallet_signature.Evm;
        const checksummedAddress = checksumCaseAddress(bytesToHex(evm_address));
        return { type: "evm", checksummedAddress };
      } else {
        const { solana_address } = entry.chain_wallet_signature.Solana;
        const base58Address = bs58.encode(solana_address);
        return { type: "solana", base58Address };
      }
    });
  }

  /**
   * Sends a request to an EVM signer to sign over the result of the user's
   * specified `RecipeExecution` given a pre-existing offer that was declared
   * by the EVM signature provider.
   *
   * @param recipeExecutionAh The `ActionHash` of the `RecipeExecution`
   * `Record` for which the user wishes to have the result signed over.
   * @param signingOfferAh The `ActionHash` of the `SigningOffer` `Record` that
   * specifies the `Recipe` for which the user has an `RecipeExecution`
   * @param opts Options for changing the retry behaviour
   * @returns The EVM-signed `RecipeExecution` result.
   */
  async requestEvmSignatureOverRecipeExecutionResult(
    recipeExecutionAh: ActionHash,
    signingOfferAh: ActionHash,
    opts = { timeoutMs: 60_000, retryDelay: 1_000 }
  ) {
    const requestor = new EvmBytesSignatureRequestorClient(this.appClient);
    const signedExecutionResult = await retryUntilIf(
      () =>
        requestor.requestEvmSignature({ recipeExecutionAh, signingOfferAh }),
      opts.timeoutMs,
      opts.retryDelay,
      (err) => err.message.includes("RecipeExecution not found")
    );
    requestor.destroy();
    return signedExecutionResult;
  }
}
