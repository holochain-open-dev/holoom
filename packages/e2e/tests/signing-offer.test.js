const { startTestContainers } = require("./utils/testcontainers");
const { loadPageAndRegister } = require("./utils/holo");
const {
  verifyMessage,
  bytesToHex,
  encodePacked,
  keccak256,
  hexToBytes,
} = require("viem");

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
                program:
                  '[1, "016345785d8a0000", "48509e384C66FDa5cFDF12A360B9eF2367158938", "uhCAknOsaM2At-JjiUzHGuk_YXuNwQDYcPK-Pyq_feS3n6oLc_C2N"]',
              },
            ],
          ],
        },
      });
      return Array.from(recipeRecord.signed_action.hashed.hash);
    });
    debug("Created recipe");

    const createOfferResp = await fetch(
      "http://localhost:8002/evm-signing-offer",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer password",
        },
        body: JSON.stringify({
          identifier: "123",
          evm_signing_offer: {
            recipe_ah,
            u256_items: [
              { type: "Uint" },
              { type: "Hex" },
              { type: "Hex" },
              { type: "HoloAgent" },
            ],
          },
        }),
      }
    );
    expect(createOfferResp.status).toBe(200);
    debug("Created EvmSigningOffer");

    let signingOfferActionHashNumArray;
    while (true) {
      signingOfferActionHashNumArray = await page.evaluate(async () => {
        const actionHash = await clients.holo.callZome({
          role_name: "holoom",
          zome_name: "username_registry",
          fn_name: "get_latest_evm_signing_offer_ah_for_name",
          payload: "123",
        });
        return actionHash ? Array.from(actionHash) : null;
      });
      if (signingOfferActionHashNumArray) {
        break;
      } else {
        await new Promise((r) => setTimeout(r, 500));
      }
    }
    debug("Polled until EvmSigningOffer gossiped");

    let ahsNumArrs;
    while (true) {
      ahsNumArrs = await page.evaluate(
        async (evmAddressNumArr) => {
          const ahs = await clients.holo.callZome({
            role_name: "holoom",
            zome_name: "username_registry",
            fn_name: "get_signing_offer_ahs_for_evm_address",
            payload: new Uint8Array(evmAddressNumArr),
          });
          return ahs.map((ah) => Array.from(ah));
        },
        Array.from(hexToBytes("0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"))
      );
      if ((ahsNumArrs?.length ?? 0) > 0) {
        break;
      } else {
        await new Promise((r) => setTimeout(r, 500));
      }
    }

    expect(ahsNumArrs).toEqual([signingOfferActionHashNumArray]);
    debug("Check offer linked against evm address");

    const signature = await page.evaluate(
      async (recipe_ah, signingOfferActionHashNumArray) => {
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
                signingOfferAh: new Uint8Array(signingOfferActionHashNumArray),
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
      signingOfferActionHashNumArray
    );
    debug("Executed recipe and received signature for it");

    const packed = encodePacked(
      ["uint256", "uint256", "uint256", "uint256"],
      [
        1,
        (10n * 10n ** 18n) / 100n,
        "0x48509e384C66FDa5cFDF12A360B9eF2367158938",
        // Big endian u256 read of raw 32 of uhCAknOsaM2At-JjiUzHGuk_YXuNwQDYcPK-Pyq_feS3n6oLc_C2N
        70976194269703664889787012553258964581971848280304479022442879760825621932674n,
      ]
    );
    const raw = keccak256(packed);
    const signatureHex = bytesToHex(new Uint8Array(signature));

    const isValid = await verifyMessage({
      message: { raw },
      signature: signatureHex,
      address: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
    });
    expect(isValid).toBe(true);
  }, 120_000);
});
