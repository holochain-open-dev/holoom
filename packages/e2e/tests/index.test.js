const { GenericContainer, Network } = require("testcontainers");

const BOOTSTRAP_PORT = 51804;
const SIGNAL_PORT = 51805;

function startLocalServicesContainer(network) {
  return new GenericContainer("game-identity/local-services")
    .withNetwork(network)
    .withEnvironment({
      BOOTSTRAP_PORT,
      SIGNAL_PORT,
    })
    .withCommand("/run.sh")
    .start();
}

function startAuthorityContainer(network, localServicesIp) {
  return new GenericContainer("game-identity/authority-agent-sandbox")
    .withNetwork(network)
    .withEnvironment({
      BOOTSTRAP_SERVER_OVERRIDE: `http://${localServicesIp}:${BOOTSTRAP_PORT}`,
      SIGNAL_SERVER_OVERRIDE: `ws://${localServicesIp}:${SIGNAL_PORT}`,
    })
    .withCommand("/run.sh")
    .start();
}

function startHoloContainer(network, localServicesIp) {
  return new GenericContainer("game-identity/holo-dev-server")
    .withExposedPorts(
      { host: 24274, container: 24274 },
      { host: 9999, container: 9999 }
    )
    .withNetwork(network)
    .withEnvironment({
      BOOTSTRAP_SERVER: `http://${localServicesIp}:${BOOTSTRAP_PORT}`,
      SIGNAL_SERVER: `ws://${localServicesIp}:${SIGNAL_PORT}`,
    })
    .withCommand("/run.sh")
    .start();
}

async function loadPageAndRegister(email, password) {
  await page.goto("http://localhost:5173");
  let frame;
  while (true) {
    const frames = await page.frames();
    frame = frames[1];
    try {
      await frame.waitForSelector("#email", { timeout: 1000 });
      break;
    } catch {
      // Loaded iframe before "holoport" was ready
      await page.reload();
    }
  }
  await frame.type("#email", email);
  await frame.type("#password", password);
  await frame.type("#confirm-password", password);
  await frame.click("#submit-button");

  // Wait until form processes and client ready
  await page.evaluate(async () => {
    await window.gameIdentityClientProm;
  });
}

describe("HolochainGameIdentityClient", () => {
  let network;
  let localServicesContainer;
  let authorityContainer;
  let holoContainer;
  beforeEach(async () => {
    debug("Setup started");
    network = await new Network().start();
    debug("Network created");
    localServicesContainer = await startLocalServicesContainer(network);
    const localServiceIp = localServicesContainer.getIpAddress(
      network.getName()
    );
    debug("Started local-services");
    // The next two containers only depend on local-services, and can be
    // loaded in parallel.
    const authorityContainerProm = startAuthorityContainer(
      network,
      localServiceIp
    );
    const holoContainerProm = startHoloContainer(network, localServiceIp);
    authorityContainer = await authorityContainerProm;
    holoContainer = await holoContainerProm;
    debug("Started authority-agent-sandbox and holo-dev-server");
  }, 60_000);

  afterEach(async () => {
    debug("Teardown started");
    await Promise.all([
      Promise.all([
        localServicesContainer.stop(),
        authorityContainer.stop(),
        holoContainer.stop(),
      ]).then(() => network.stop()),
      jestPuppeteer.resetPage(),
    ]);
    debug("Teardown finished");
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
