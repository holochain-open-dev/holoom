const { GenericContainer, Network } = require("testcontainers");
const createDebug = require("debug");

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

function startRocketContainer(network, authorityIp) {
  return new GenericContainer("game-identity/rocket")
    .withExposedPorts({ host: 8000, container: 8000 })
    .withNetwork(network)
    .withEnvironment({
      ROCKET_ADDRESS: "0.0.0.0",
      ROCKET_LOG_LEVEL: "debug",
      HOLOCHAIN_HOST_NAME: authorityIp,
      HOLOCHAIN_ADMIN_WS_PORT: 3334,
      HOLOCHAIN_APP_WS_PORT: 3336,
      HOLOCHAIN_APP_ID: "game_identity",
      HOLOCHAIN_CELL_ROLES: "game_identity",
    })
    .withLogConsumer((stream) => {
      const logInfo = createDebug("e2e:rocket:info");
      const logErr = createDebug("e2e:rocket:error");
      stream.on("data", logInfo);
      stream.on("err", logErr);
    })
    .withCommand("/usr/local/bin/game_identity_rocket_server")
    .start();
}

module.exports.startTestContainers = async () => {
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
    ]);
    await network.stop();
    debug("Finished test container teardown");
  };

  return { stop };
};
