const { startTestContainers } = require("./utils/testcontainers");
const { loadPageAndRegister } = require("./utils/holo");
const { verifyMessage, bytesToHex } = require("viem");

describe("signing-offer", () => {
  let testContainers;
  beforeEach(async () => {
    testContainers = await startTestContainers({ evmSigner: true });
  }, 120_000);
  afterEach(async () => {
    await Promise.all([testContainers?.stop(), jestPuppeteer.resetPage()]);
  });

  it("Should produce signed u256 array", async () => {
    debug("Started test");
    await loadPageAndRegister("test@test.com", "test1234");
    debug("Loaded chaperone and registered agent");

    const recipe_ah = await page.evaluate(async () => {
      const recipeRecord = await clients.holo.callZome({
        role_name: "holoom",
        zome_name: "username_registry",
        fn_name: "create_recipe",
        payload: {
          trusted_authors: [clients.holo.myPubKey],
          arguments: [],
          instructions: [
            [
              "$return",
              {
                type: "Jq",
                input_var_names: { type: "List", var_names: [] },
                program: '["f39Fd6e51aad88F6F4ce6aB8827279cffFb92266", 123]',
              },
            ],
          ],
        },
      });
      return Array.from(recipeRecord.signed_action.hashed.hash);
    });
    debug("Created recipe");

    await fetch("http://localhost:8002/evm-signing-offer", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer password",
      },
      body: JSON.stringify({
        identifier: "123",
        evm_signing_offer: {
          recipe_ah,
          u256_items: [{ type: "Hex" }, { type: "Uint" }],
        },
      }),
    });
    debug("Created EvmSigningOffer");

    let signingOfferActionHash;
    while (true) {
      signingOfferActionHash = await page.evaluate(async () => {
        const actionHash = await clients.holo.callZome({
          role_name: "holoom",
          zome_name: "username_registry",
          fn_name: "get_latest_evm_signing_offer_ah_for_name",
          payload: "123",
        });
        return actionHash ? Array.from(actionHash) : null;
      });
      if (signingOfferActionHash) {
        break;
      } else {
        await new Promise((r) => setTimeout(r, 500));
      }
    }
    debug("Polled until EvmSigningOffer gossiped");

    const signature = await page.evaluate(
      async (recipe_ah, evm_signing_offer_ah) => {
        const executionRecord = await clients.holo.callZome({
          role_name: "holoom",
          zome_name: "username_registry",
          fn_name: "execute_recipe",
          payload: {
            recipe_ah: new Uint8Array(recipe_ah),
            arguments: [],
          },
        });
        while (true) {
          try {
            const signedContext =
              await clients.evmSignatureRequestor.requestEvmSignature({
                recipeExecutionAh: executionRecord.signed_action.hashed.hash,
                signingOfferAh: new Uint8Array(evm_signing_offer_ah),
              });
            // Flatten signature
            return [
              ...Array.from(signedContext.signature[0]),
              ...Array.from(signedContext.signature[1]),
              signedContext.signature[2],
            ];
          } catch (err) {
            if (err.message.includes("RecipeExecution not found")) {
              await new Promise((r) => setTimeout(r, 500));
            } else {
              throw err;
            }
          }
        }
      },
      recipe_ah,
      Array.from(signingOfferActionHash)
    );
    debug("Executed recipe and received signature for it");

    const isValid = await verifyMessage({
      message: {
        raw: new Uint8Array([
          0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 243, 159, 214, 229, 26, 173, 136,
          246, 244, 206, 106, 184, 130, 114, 121, 207, 255, 185, 34, 102, 0, 0,
          0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
          0, 0, 0, 0, 0, 0, 123,
        ]),
      },
      signature: bytesToHex(new Uint8Array(signature)),
      address: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
    });
    expect(isValid).toBe(true);
  }, 120_000);
});
