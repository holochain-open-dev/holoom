const { startTestContainers } = require("./utils/testcontainers");
const { loadPageAndRegister } = require("./utils/holo");
const { postOracleWebhook } = require("./utils/oracle");

describe("metadata", () => {
  let testContainers;
  beforeEach(async () => {
    testContainers = await startTestContainers({ oracle: true });
  }, 60_000);
  afterEach(async () => {
    await Promise.all([testContainers?.stop(), jestPuppeteer.resetPage()]);
  });

  it("Should aggregate from attested json", async () => {
    debug("Started test");
    await loadPageAndRegister("test@test.com", "test1234");
    debug("Loaded chaperone and registered agent");

    // Check the jq initially interprets the collection as empty
    await expect(
      page.evaluate(() =>
        clients.holoom.refreshJq({
          program: "[.[].name]",
          input: { collection: "tournaments" },
        })
      )
    ).resolves.toEqual([]);
    debug("Tested empty collection");

    await postOracleWebhook("tournament_created", {
      id: "tournament-1",
      name: "super-rank",
    });
    await postOracleWebhook("tournament_created", {
      id: "tournament-2",
      name: "mega-rank",
    });
    debug("Published two oracle documents");

    // Poll until consistency
    while (true) {
      const output = await page.evaluate(() =>
        clients.holoom.refreshJq({
          program: "[.[].name]",
          input: { collection: "tournaments" },
        })
      );
      if (output.length === 2) {
        expect(output).toEqual(["super-rank", "mega-rank"]);
        break;
      }
      await new Promise((r) => setTimeout(r, 200));
    }
    debug("Polled jq program until oracle documents included");

    await postOracleWebhook("tournament_updated", {
      id: "tournament-2",
      name: "uber-rank",
    });

    // Poll until consistency
    while (true) {
      const output = await page.evaluate(() =>
        clients.holoom.refreshJq({
          program: "[.[].name]",
          input: { collection: "tournaments" },
        })
      );
      if (output[1] !== "mega-rank") {
        expect(output).toEqual(["super-rank", "uber-rank"]);
        break;
      }
      await new Promise((r) => setTimeout(r, 200));
    }
    debug("Polled jq program until revised oracle document included");
  }, 120_000);
});
