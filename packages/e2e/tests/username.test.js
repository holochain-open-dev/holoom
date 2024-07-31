const { startTestContainers } = require("./utils/testcontainers");
const { loadPageAndRegister } = require("./utils/holo");
const { queryFetch } = require("./utils/query");

describe("username", () => {
  let testContainers;
  beforeEach(async () => {
    testContainers = await startTestContainers({ query: true });
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
      page.evaluate(() => clients.holoom.getUsername())
    ).resolves.toBeNull();
    debug("Checked username initially null");

    await expect(queryFetch("username_registry")).resolves.toEqual({
      success: true,
      items: [],
    });
    debug("Checked query serves empty user list");

    // First register succeeds
    await expect(
      page.evaluate(() => clients.holoom.registerUsername("test1234"))
    ).resolves.toBeUndefined();
    debug("Registered username");

    // Poll username until defined (gossiping)
    while (true) {
      const result = await page.evaluate(() => clients.holoom.getUsername());
      if (result) {
        expect(result).toBe("test1234");
        break;
      }
    }
    debug("Polled username until correctly gossiped");

    // Second registration fails
    await expect(
      page.evaluate(() => clients.holoom.registerUsername("test1234"))
    ).rejects.toSatisfy((error) => error.message.includes("InvalidCommit"));
    debug("Checked second registration fails");

    await expect(queryFetch("username_registry")).resolves.toSatisfy(
      (data) => data.items.length === 1 && data.items[0].username === "test1234"
    );
    debug("Checked query serves single user");
  }, 120_000);
});
