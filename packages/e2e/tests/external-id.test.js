const { startTestContainers } = require("./utils/testcontainers");
const { loadPageAndRegister } = require("./utils/holo");

describe("external-id", () => {
  let testContainers;
  beforeEach(async () => {
    testContainers = await startTestContainers({ externalId: true });
  }, 60_000);
  afterEach(async () => {
    await Promise.all([testContainers?.stop(), jestPuppeteer.resetPage()]);
  });

  it("should bind a valid access token", async () => {
    debug("Started test");
    await loadPageAndRegister("test@test.com", "test1234");
    debug("Loaded chaperone and registered agent");

    page.evaluate(async () => clients.faceitAuthFlow.start());
    debug("Started authorisation flow");

    while (true) {
      try {
        const result = await page.evaluate(async () => {
          const attestation = await externalIdRequestProm;
          return attestation.display_name;
        });
        expect(result).toBe("molly");
        break;
      } catch (err) {
        await new Promise((r) => setTimeout(r, 1000));
      }
    }
    debug("Waited for attestation to be created");
  }, 120_000);
});
