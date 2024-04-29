const { startTestContainers } = require("./utils/testcontainers");
const { loadPageAndRegister } = require("./utils/holo");
const { rocketFetch } = require("./utils/rocket");

describe("metadata", () => {
  let testContainers;
  beforeEach(async () => {
    testContainers = await startTestContainers();
  }, 60_000);
  afterEach(async () => {
    await Promise.all([testContainers.stop(), jestPuppeteer.resetPage()]);
  });

  it("Should manage metadata like key-value store", async () => {
    debug("Started test");
    await loadPageAndRegister("test@test.com", "test1234");
    debug("Loaded chaperone and registered agent");

    await expect(
      page.evaluate(() =>
        window.gameIdentityClient.getMetadata("profile-picture")
      )
    ).resolves.toBeNull();
    debug("Checked profile-picture metadata initially null");

    const agentPubKeyB64 = await page.evaluate(() => window.agentPubKeyB64);

    await expect(
      rocketFetch(`username_registry/${agentPubKeyB64}/metadata`)
    ).resolves.toEqual({
      success: true,
      metadata: {},
    });
    debug("Checked rocket serves empty metadata");

    await expect(
      page.evaluate(() =>
        window.gameIdentityClient.setMetadata("profile-picture", "image1.jpg")
      )
    ).resolves.toBeUndefined();
    debug("Set profile-picture metadata");

    await expect(
      page.evaluate(() =>
        window.gameIdentityClient.getMetadata("profile-picture")
      )
    ).resolves.toBe("image1.jpg");
    debug("Checked profile-picture metadata set");

    await expect(
      page.evaluate(() =>
        window.gameIdentityClient.setMetadata("location", "moon")
      )
    ).resolves.toBeUndefined();
    debug("Set location metadata");

    await expect(
      page.evaluate(() => window.gameIdentityClient.getMetadata("location"))
    ).resolves.toBe("moon");
    debug("Checked location metadata set");

    await expect(
      page.evaluate(() =>
        window.gameIdentityClient.setMetadata("profile-picture", "image2.jpg")
      )
    ).resolves.toBeUndefined();
    debug("Replace profile-picture metadata");

    await expect(
      page.evaluate(() =>
        window.gameIdentityClient.getMetadata("profile-picture")
      )
    ).resolves.toBe("image2.jpg");
    debug("Checked profile-picture metadata replaced");

    await expect(
      page.evaluate(() => window.gameIdentityClient.getMetadata("location"))
    ).resolves.toBe("moon");
    debug("Checked location metadata unchanged");

    // Poll metadata until defined (gossiping)
    while (true) {
      const data = await rocketFetch(
        `username_registry/${agentPubKeyB64}/metadata`
      );
      if (
        data.metadata.location === "moon" &&
        data.metadata["profile-picture"] === "image2.jpg"
      ) {
        break;
      }
      await new Promise((r) => setTimeout(r, 500));
    }
    debug("Polled rocket metadata until metadata matched expected");
  }, 120_000);
});
