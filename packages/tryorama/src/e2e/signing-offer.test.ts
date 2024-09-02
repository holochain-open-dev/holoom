import { runScenario, dhtSync } from "@holochain/tryorama";
import { expect, test } from "vitest";
import { setupPlayer } from "../utils/setup-happ";
import { ActionHash, AppClient } from "@holochain/client";
import {
  EvmBytesSignerClient,
  BytesSigner,
  OfferCreator,
} from "@holoom/authority";
import { flattenEvmSignatureToHex, forMs, HoloomClient } from "@holoom/client";
import { encodePacked, keccak256, verifyMessage } from "viem";

// This service is is intended to be run as a sandboxed microservice, but that
// is not a concern of this test, hence we cheat and instantiate locally.
function createEvmBytesSignerService(appClient: AppClient) {
  // First private key of seed phrase:
  // test test test test test test test test test test test junk
  const EVM_PRIVATE_KEY =
    "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
  const bytesSigner = new BytesSigner(EVM_PRIVATE_KEY);

  // Handles happ signals
  const evmBytesSignerClient = new EvmBytesSignerClient(appClient, bytesSigner);

  // Intended to be used as an admin controller in server app
  const offerCreator = new OfferCreator(appClient, bytesSigner);

  return {
    offerCreator,
    setup: () => evmBytesSignerClient.setup(),
    destroy: () => evmBytesSignerClient.destroy(),
  };
}

test("e2e signing offer", async () => {
  await runScenario(async (scenario) => {
    const [authority] = await setupPlayer(scenario);
    const [alice, aliceCoordinators] = await setupPlayer(scenario);
    await scenario.shareAllAgents();

    const evmBytesSignerService = createEvmBytesSignerService(
      authority.appWs as AppClient
    );
    await evmBytesSignerService.setup();

    // It doesn't really matter who creates the recipe, since it's the signing
    // offer to come that denotes who trusts it.
    const recipeRecord = await aliceCoordinators.usernameRegistry.createRecipe({
      trusted_authors: [authority.agentPubKey],
      arguments: [],
      instructions: [
        [
          "$return",
          {
            type: "Jq",
            input_var_names: { type: "List", var_names: [] },
            program:
              '[1, "016345785d8a0000", "48509e384C66FDa5cFDF12A360B9eF2367158938", "uhCAknOsaM2At-JjiUzHGuk_YXuNwQDYcPK-Pyq_feS3n6oLc_C2N"]',
          },
        ],
      ],
    });

    // I'm surprised this wait on dht sync is necessary. The offer creator
    // already allows 10s of polling for the recipe to be gossiped.
    await dhtSync([authority, alice], alice.cells[0].cell_id[0]);

    // This would normally be behind an admin authorised POST endpoint
    await evmBytesSignerService.offerCreator.createOffer(
      "123",
      Array.from(recipeRecord.signed_action.hashed.hash),
      [
        { type: "Uint" },
        { type: "Hex" },
        { type: "Hex" },
        { type: "HoloAgent" },
      ]
    );

    // Wait for signing offer to be gossiped
    let signingOfferAh: ActionHash;
    while (true) {
      signingOfferAh =
        await aliceCoordinators.usernameRegistry.getLatestEvmSigningOfferAhForName(
          "123"
        );
      if (signingOfferAh) break;
      await forMs(500);
    }

    const recipeExecutionRecord =
      await aliceCoordinators.usernameRegistry.executeRecipe({
        recipe_ah: recipeRecord.signed_action.hashed.hash,
        arguments: [],
      });

    const evmSignedResult = await new HoloomClient(
      alice.appWs as AppClient
    ).requestEvmSignatureOverRecipeExecutionResult(
      recipeExecutionRecord.signed_action.hashed.hash,
      signingOfferAh
    );

    // This corresponds to the u256 packing performed in
    // `ingest_evm_signature_over_recipe_execution_request`
    const packed = encodePacked(
      ["uint256", "uint256", "uint256", "uint256"],
      [
        BigInt(1),
        (BigInt(10) * BigInt(10) ** BigInt(18)) / BigInt(100),
        BigInt("0x48509e384C66FDa5cFDF12A360B9eF2367158938"),
        // Big endian u256 read of raw 32 of uhCAknOsaM2At-JjiUzHGuk_YXuNwQDYcPK-Pyq_feS3n6oLc_C2N
        BigInt(
          "70976194269703664889787012553258964581971848280304479022442879760825621932674"
        ),
      ]
    );
    const raw = keccak256(packed);

    await expect(
      verifyMessage({
        message: { raw },
        signature: flattenEvmSignatureToHex(evmSignedResult.signature),
        address: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
      })
    ).resolves.toBe(true);

    evmBytesSignerService.destroy();
  });
});
