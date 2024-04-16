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
  holoContainer = await holoContainerProm;
  debug("Started authority-agent-sandbox and holo-dev-server");
  debug("Finished test container setup");

  const stop = async () => {
    debug("Begin test container teardown");
    await Promise.all([
      localServicesContainer.stop(),
      authorityContainer.stop(),
      holoContainer.stop(),
    ]);
    await network.stop();
    debug("Finished test container teardown");
  };

  return { stop };
};
