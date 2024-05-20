const { GenericContainer, Network } = require("testcontainers");
const createDebug = require("debug");

const BOOTSTRAP_PORT = 51804;
const SIGNAL_PORT = 51805;

function startLocalServicesContainer(network) {
  return new GenericContainer("holoom/local-services")
    .withNetwork(network)
    .withEnvironment({
      BOOTSTRAP_PORT,
      SIGNAL_PORT,
    })
    .withCommand("/run.sh")
    .start();
}

function startAuthorityContainer(network, localServicesIp) {
  return new GenericContainer("holoom/authority-agent-sandbox")
    .withNetwork(network)
    .withEnvironment({
      BOOTSTRAP_SERVER_OVERRIDE: `http://${localServicesIp}:${BOOTSTRAP_PORT}`,
      SIGNAL_SERVER_OVERRIDE: `ws://${localServicesIp}:${SIGNAL_PORT}`,
      ADMIN_WS_PORT_INTERNAL: 3333,
      ADMIN_WS_PORT_EXPOSED: 3334,
      APP_WS_PORT_INTERNAL: 3335,
      APP_WS_PORT_EXPOSED: 3336,
    })
    .withLogConsumer((stream) => {
      const logInfo = createDebug("e2e:authority:info");
      const logErr = createDebug("e2e:authority:error");
      stream.on("data", logInfo);
      stream.on("err", logErr);
    })
    .withCommand("/run.sh")
    .start();
}

function startHoloContainer(network, localServicesIp) {
  return new GenericContainer("holoom/holo-dev-server")
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

function startRocketContainer(network, authorityIp) {
  return new GenericContainer("holoom/rocket")
    .withExposedPorts({ host: 8000, container: 8000 })
    .withNetwork(network)
    .withEnvironment({
      ROCKET_ADDRESS: "0.0.0.0",
      ROCKET_LOG_LEVEL: "debug",
      HOLOCHAIN_HOST_NAME: authorityIp,
      HOLOCHAIN_ADMIN_WS_PORT: 3334,
      HOLOCHAIN_APP_WS_PORT: 3336,
      HOLOCHAIN_APP_ID: "holoom",
      HOLOCHAIN_CELL_ROLES: "holoom",
    })
    .withLogConsumer((stream) => {
      const logInfo = createDebug("e2e:rocket:info");
      const logErr = createDebug("e2e:rocket:error");
      stream.on("data", logInfo);
      stream.on("err", logErr);
    })
    .withCommand("/usr/local/bin/holoom_rocket_server")
    .start();
}

function startExternalIdAttestorContainer(network, authorityIp, mockAuthIp) {
  return new GenericContainer("holoom/external-id-attestor")
    .withNetwork(network)
    .withEnvironment({
      HOLOCHAIN_HOST_NAME: authorityIp,
      HOLOCHAIN_ADMIN_WS_PORT: 3334,
      HOLOCHAIN_APP_WS_PORT: 3336,
      HOLOCHAIN_APP_ID: "holoom",
      AUTH_TOKEN_ENDPOINT: `http://${mockAuthIp}:3002/token`,
      AUTH_CLIENT_SECRET: "mock-client-secret",
      AUTH_REDIRECT_URI: "http://localhost:5173/auth/callback/faceit",
      AUTH_USER_INFO_ENDPOINT: `http://${mockAuthIp}:3002/userinfo`,
      AUTH_EXTERNAL_ID_FIELD_NAME: "guid",
      AUTH_DISPLAY_NAME_FIELD_NAME: "nickname",
    })
    .withLogConsumer((stream) => {
      const logInfo = createDebug("e2e:external-id-attestor:info");
      const logErr = createDebug("e2e:external-id-attestor:error");
      stream.on("data", logInfo);
      stream.on("err", logErr);
    })
    .withCommand(["npm", "start"])
    .start();
}

function startMockAuthContainer(network) {
  return new GenericContainer("holoom/mock-auth")
    .withNetwork(network)
    .withExposedPorts({ host: 3002, container: 3002 })
    .withEnvironment({
      PORT: "3002",
    })
    .withCommand(["node", "index.js"])
    .start();
}

module.exports.startTestContainers = async (
  includeExternalIdAttestorAndMockAuth = false
) => {
  debug("Begin test container setup");
  network = await new Network().start();
  debug("Network created");
  localServicesContainer = await startLocalServicesContainer(network);
  const localServiceIp = localServicesContainer.getIpAddress(network.getName());
  debug("Started local-services");
  // The next two containers only depend on local-services, and can be
  // loaded in parallel.
  const authorityContainerProm = startAuthorityContainer(
    network,
    localServiceIp
  );
  const holoContainerProm = startHoloContainer(network, localServiceIp);
  authorityContainer = await authorityContainerProm;
  const authorityIp = authorityContainer.getIpAddress(network.getName());
  const rocketContainer = await startRocketContainer(network, authorityIp);
  const mockAuthContainer = includeExternalIdAttestorAndMockAuth
    ? await startMockAuthContainer(network)
    : null;
  const mockAuthIp = mockAuthContainer?.getIpAddress(network.getName());
  const externalIdAttestorContainer = includeExternalIdAttestorAndMockAuth
    ? await startExternalIdAttestorContainer(network, authorityIp, mockAuthIp)
    : null;
  holoContainer = await holoContainerProm;
  debug("Started authority-agent-sandbox and holo-dev-server");
  debug("Finished test container setup");

  const stop = async () => {
    debug("Begin test container teardown");
    await Promise.all([
      localServicesContainer.stop(),
      authorityContainer.stop(),
      holoContainer.stop(),
      rocketContainer.stop(),
      externalIdAttestorContainer?.stop() ?? Promise.resolve(),
      mockAuthContainer?.stop() ?? Promise.resolve(),
    ]);
    await network.stop();
    debug("Finished test container teardown");
  };

  return { stop };
};
