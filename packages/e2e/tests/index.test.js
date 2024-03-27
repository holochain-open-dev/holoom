const { GenericContainer, Wait, Network } = require("testcontainers");

const BOOTSTRAP_PORT = 51804;
const SIGNAL_PORT = 51805;

function startLocalServicesContainer(network) {
  return new GenericContainer("game-identity-local-services")
    .withNetwork(network)
    .withEnvironment({
      BOOTSTRAP_PORT,
      SIGNAL_PORT,
    })
    .withCommand("/run.sh")
    .start();
}

function startAuthorityContainer(network, localServicesIp) {
  return new GenericContainer("game-identity-authority-agent-sandbox")
    .withNetwork(network)
    .withEnvironment({
      BOOTSTRAP_SERVER_OVERRIDE: `http://${localServicesIp}:${BOOTSTRAP_PORT}`,
      SIGNAL_SERVER_OVERRIDE: `ws://${localServicesIp}:${SIGNAL_PORT}`,
    })
    .withCommand("/run.sh")
    .start();
}

function startHoloContainer(network, localServicesIp) {
  return new GenericContainer("game-identity-holo-dev-server")
    .withExposedPorts(
      { host: 24274, container: 24274 },
      { host: 9999, container: 9999 }
    )
    .withNetwork(network)
    .withEnvironment({
      BOOTSTRAP_SERVER: `http://${localServicesIp}:${BOOTSTRAP_PORT}`,
      SIGNAL_SERVER: `ws://${localServicesIp}:${SIGNAL_PORT}`,
    })
    .withHealthCheck({
      test: ["CMD-SHELL", "netstat -an | grep -q 24274"],
    })
    .withWaitStrategy(Wait.forHealthCheck())
    .withCommand("/run.sh")
    .start();
}

async function submitHoloRegisterForm(email, password) {
  const frames = await page.frames();
  const frame = frames[1];
  await frame.waitForSelector("#email");
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
    console.log("Creating network...");
    network = await new Network().start();
    console.log("Starting local-services...");
    localServicesContainer = await startLocalServicesContainer(network);
    const localServiceIp = localServicesContainer.getIpAddress(
      network.getName()
    );
    // The next two containers only depend on local-services, and can be
    // loaded in parallel.
    console.log("Starting authority-agent-sandbox and holo-dev-server...");
    const authorityContainerProm = startAuthorityContainer(
      network,
      localServiceIp
    );
    const holoContainerProm = startHoloContainer(network, localServiceIp);
    authorityContainer = await authorityContainerProm;
    holoContainer = await holoContainerProm;
    console.log("Navigating to UI...");
    await page.goto("http://localhost:5173");
    console.log("Setup complete");
  }, 60_000);

  afterEach(async () => {
    await Promise.all([
      Promise.all([
        localServicesContainer.stop(),
        authorityContainer.stop(),
        holoContainer.stop(),
      ]).then(() => network.stop()),
      jestPuppeteer.resetPage(),
    ]);
  });

  it("should register only one username", async () => {
    console.log("Loading chaperone and registering agent...");
    await submitHoloRegisterForm("test@test.com", "test1234");

    // Starts with no username
    console.log("Checking username initially null...");
    await expect(
      page.evaluate(() => window.gameIdentityClient.getUsername())
    ).resolves.toBeNull();

    // First register succeeds
    console.log("Registering username...");
    await expect(
      page.evaluate(() =>
        window.gameIdentityClient.registerUsername("test1234")
      )
    ).resolves.toBeUndefined();

    // 1 minute gossip
    console.log("Allowing time to gossip...");
    await new Promise((r) => setTimeout(r, 10_000));

    // Username is now defined
    console.log("Checking username now defined...");
    await expect(
      page.evaluate(() => window.gameIdentityClient.getUsername())
    ).resolves.toBe("test1234");

    // Second registration fails
    console.log("Checking second registration fails...");
    await expect(
      page.evaluate(() =>
        window.gameIdentityClient.registerUsername("test1234")
      )
    ).rejects.toSatisfy((error) => error.message.includes("InvalidCommit"));
  }, 120_000);
});
