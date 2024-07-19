const { privateKeyToAccount } = require("viem/accounts");
const { startTestContainers } = require("./utils/testcontainers");
const { loadPageAndRegister } = require("./utils/holo");
const { queryFetch } = require("./utils/query");

describe("EVM Wallet Binding", () => {
  let testContainers;
  beforeEach(async () => {
    testContainers = await startTestContainers({ rocket: true });
  }, 60_000);
  afterEach(async () => {
    await Promise.all([testContainers?.stop(), jestPuppeteer.resetPage()]);
  });

  it("should register only one username", async () => {
    debug("Started test");
    await loadPageAndRegister("test@test.com", "test1234");
    debug("Loaded chaperone and registered agent");

    // Starts with no username
    await expect(
      page.evaluate(() => clients.holoom.getBoundWallets())
    ).resolves.toEqual([]);
    debug("Checked bound wallets initially empty");

    const agentPubKeyB64 = await page.evaluate(() => window.agentPubKeyB64);

    await expect(
      queryFetch(`username_registry/${agentPubKeyB64}/wallets`)
    ).resolves.toEqual({
      success: true,
      evm_addresses: [],
      solana_addresses: [],
    });
    debug("Checked rocket serves empty wallet list");

    // Setup EVM signer in memory
    // First account of seed phrase: test test test test test test test test test test test junk
    let evmPrivateKey =
      "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
    const account = privateKeyToAccount(evmPrivateKey);

    // Get and sign the binding message
    const message = await page.evaluate(
      (address) => clients.holoom.getEvmWalletBindingMessage(address),
      account.address
    );
    const evmSignature = await account.signMessage({ message });

    // Submit the signature
    await expect(
      page.evaluate(
        (addr, sig) => clients.holoom.submitEvmWalletBinding(addr, sig),
        account.address,
        evmSignature
      )
    ).resolves.toBeUndefined();
    debug("Submitted wallet binding signature");

    // Poll bound wallets until defined (gossiping)
    while (true) {
      const boundWallets = await page.evaluate(() =>
        clients.holoom.getBoundWallets()
      );
      if (boundWallets.length) {
        expect(boundWallets).toEqual([
          { type: "evm", checksummedAddress: account.address },
        ]);
        break;
      }
    }
    debug("Polled bound wallets until correctly gossiped");

    // Poll rocket until bound wallet gossiped
    while (true) {
      const data = await queryFetch(
        `username_registry/${agentPubKeyB64}/wallets`
      );
      if (data.evm_addresses.length > 0) {
        expect(data).toEqual({
          success: true,
          evm_addresses: [account.address],
          solana_addresses: [],
        });
        break;
      }
      await new Promise((r) => setTimeout(r, 500));
    }
    debug("Polled bound wallets on rocket until correctly gossiped");
  }, 120_000);
});
