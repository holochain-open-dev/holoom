/**
 * A mock CO₂ sensor, that emits a random measure in grams roughly every 2
 * seconds. The "measurements" are published by a sandboxed holochain agent
 * that serves no other role in the network.
 */

import { ensureAndConnectToHapp } from "@holoom/sandbox";
import {
  UsernameRegistryCoordinator,
  RecordsCoordinator,
  Recipe,
  SignedEvmSigningOffer,
  EvmU256Item,
} from "@holoom/types";
import { encodeHashToBase64, AppClient, AgentPubKey } from "@holochain/client";
import {
  BytesSigner,
  EvmBytesSignerClient,
  OfferCreator,
} from "@holoom/authority";
import { decodeAppEntry } from "@holoom/client";

async function main() {
  // Create a conductor sandbox (with holoom installed) at the specified
  // directory if it doesn't already exist, and connect to it.
  const { appWs } = await ensureAndConnectToHapp(
    "/sandbox",
    "/workdir/holoom.happ",
    "emissions-local-test-2024-09-04T12:59",
    {
      bootstrapServerUrl: new URL("https://bootstrap-0.infra.holochain.org"),
      signalingServerUrl: new URL("wss://sbd-0.main.infra.holo.host"),
      iceServers: [
        "stun:stun-0.main.infra.holo.host:443",
        "stun:stun-1.main.infra.holo.host:443",
      ],
      ephemeralPorts: {
        min: "40300",
        max: "40555",
      },
      password: "password",
    }
  );
  const app = new TokenMintSigner(appWs);
  await app.run();
}

// Auto creates a recipe + offer as defined below and listens for signing requests
class TokenMintSigner {
  bytesSigner: BytesSigner;
  offerCreator: OfferCreator;
  usernameRegistryCoordinator: UsernameRegistryCoordinator;
  recordsCoordinator: RecordsCoordinator;
  evmBytesSignerClient: EvmBytesSignerClient;
  constructor(appClient: AppClient) {
    // First private key of seed phrase:
    // test test test test test test test test test test test junk
    const EVM_PRIVATE_KEY =
      "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
    this.bytesSigner = new BytesSigner(EVM_PRIVATE_KEY);
    this.offerCreator = new OfferCreator(appClient, this.bytesSigner);
    this.usernameRegistryCoordinator = new UsernameRegistryCoordinator(
      appClient
    );
    this.recordsCoordinator = new RecordsCoordinator(appClient);
    this.evmBytesSignerClient = new EvmBytesSignerClient(
      appClient,
      this.bytesSigner
    );
  }

  async run() {
    await this.autoPublishSigningOfferAndRecipe();
    // Start listening for requests
    await this.evmBytesSignerClient.setup();
  }

  // In a more realistic setup this step would be action manually by a human who
  // has convinced themselves of which agent(s) they want to use as a data
  // source. This example automates this step to reduce test tedium.
  async autoPublishSigningOfferAndRecipe() {
    console.log("Waiting for co2-sensor author to appear");
    const co2SensorAuthor = await this.untilTrustedAuthorSelected();
    console.log(
      `Trusting ${encodeHashToBase64(co2SensorAuthor)} as co2-sensor author`
    );

    await this.ensureRecipe(...recipeForMint(co2SensorAuthor));
  }

  async untilTrustedAuthorSelected() {
    while (true) {
      const publishers =
        await this.usernameRegistryCoordinator.getAllPublishers();
      const pair = publishers.find(([_, tag]) => tag === "co2-sensor");
      if (pair) return pair[0];
      await new Promise((r) => setTimeout(r, 1000));
    }
  }

  async ensureRecipe(expectedRecipe: Recipe, expectU256Items: EvmU256Item[]) {
    const offerAhs =
      await this.usernameRegistryCoordinator.getSigningOfferAhsForEvmAddress(
        this.bytesSigner.address
      );

    for (const offerAh of offerAhs) {
      const offerRecord = await this.recordsCoordinator.getRecord(offerAh);
      if (!offerRecord) {
        console.warn(
          `Signing offer record ${encodeHashToBase64(offerAh)} not found`
        );
        continue;
      }
      const signedSigningOffer =
        decodeAppEntry<SignedEvmSigningOffer>(offerRecord);
      const recipeRecord = await this.recordsCoordinator.getRecord(
        signedSigningOffer.offer.recipe_ah
      );
      if (!recipeRecord) {
        console.warn(`Recipe record ${encodeHashToBase64(offerAh)} not found`);
        continue;
      }
      const recipe = decodeAppEntry<Recipe>(recipeRecord);
      if (
        deepEqual(recipe, expectedRecipe) &&
        deepEqual(signedSigningOffer.offer.u256_items, expectU256Items)
      ) {
        console.log(
          `Found existing matching signing offer ${encodeHashToBase64(
            offerAh
          )} and recipe ${encodeHashToBase64(
            recipeRecord.signed_action.hashed.hash
          )}`
        );
      }
    }
    const createdRecipeRecord =
      await this.usernameRegistryCoordinator.createRecipe(expectedRecipe);
    const createdSigningOfferRecord = await this.offerCreator.createOffer(
      "mint-credit",
      createdRecipeRecord.signed_action.hashed.hash,
      expectU256Items
    );
    console.log(
      `Create recipe ${encodeHashToBase64(
        createdRecipeRecord.signed_action.hashed.hash
      )} with offer ${createdSigningOfferRecord.signed_action.hashed.hash}`
    );
  }
}

const JQ_RANGE_TO_NAMES = `
[range(.from | tonumber; .until | tonumber)] |
map("co2-sensor/time/\\(.)")
`;

const JQ_ADD_READINGS = `
map(.gramsCo2) | add | [.]
`;

function recipeForMint(
  trustedCo2SensorAuthor: AgentPubKey
): [Recipe, EvmU256Item[]] {
  const recipe: Recipe = {
    trusted_authors: [trustedCo2SensorAuthor],
    arguments: [
      ["from", { type: "String" }],
      ["until", { type: "String" }],
    ],
    instructions: [
      [
        "reading_names",
        {
          type: "Jq",
          input_var_names: { type: "List", var_names: ["from", "until"] },
          program: JQ_RANGE_TO_NAMES,
        },
      ],
      ["readings", { type: "GetDocsListedByVar", var_name: "reading_names" }],
      [
        "$return",
        {
          type: "Jq",
          input_var_names: { type: "Single", var_name: "readings" },
          program: JQ_ADD_READINGS,
        },
      ],
    ],
  };
  const items: EvmU256Item[] = [{ type: "Uint" }];
  return [recipe, items];
}

function deepEqual(x: unknown, y: unknown) {
  if (x === y) {
    return true;
  }
  // Not shallowly equal, therefore only possible to be deeply equal if both
  // are instances.
  if (typeof x !== "object" || !x || typeof y !== "object" || !y) {
    return false;
  }
  if (Object.keys(x).length != Object.keys(y).length) {
    return false;
  }
  for (const prop in x) {
    if (!y.hasOwnProperty(prop)) {
      return false;
    }
    if (!deepEqual(x[prop as keyof typeof x], y[prop as keyof typeof x])) {
      return false;
    }
  }

  return true;
}

main();
