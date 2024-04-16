const { startTestContainers } = require("./utils/testcontainers");
const { loadPageAndRegister } = require("./utils/holo");

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
  }, 120_000);
});
