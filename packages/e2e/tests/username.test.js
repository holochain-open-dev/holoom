const { startTestContainers } = require("./utils/testcontainers");
const { loadPageAndRegister } = require("./utils/holo");

describe("username", () => {
  let testContainers;
  beforeEach(async () => {
    testContainers = await startTestContainers();
  }, 60_000);
  afterEach(async () => {
    await Promise.all([testContainers.stop(), jestPuppeteer.resetPage()]);
  });

  it("should register only one username", async () => {
    debug("Started test");
    await loadPageAndRegister("test@test.com", "test1234");
    debug("Loaded chaperone and registered agent");

    // Starts with no username
    await expect(
      page.evaluate(() => window.gameIdentityClient.getUsername())
    ).resolves.toBeNull();
    debug("Checked username initially null");

    // First register succeeds
    await expect(
      page.evaluate(() =>
        window.gameIdentityClient.registerUsername("test1234")
      )
    ).resolves.toBeUndefined();
    debug("Registered username");

    // Poll username until define (gossiping)
    while (true) {
      const result = await page.evaluate(() =>
        window.gameIdentityClient.getUsername()
      );
      if (result) {
        expect(result).toBe("test1234");
        break;
      }
    }
    debug("Polled username until correctly gossiped");

    // Second registration fails
    await expect(
      page.evaluate(() =>
        window.gameIdentityClient.registerUsername("test1234")
      )
    ).rejects.toSatisfy((error) => error.message.includes("InvalidCommit"));
    debug("Checked second registration fails");
  }, 120_000);
});
