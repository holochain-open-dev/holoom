const { GenericContainer, Network } = require("testcontainers");
const createDebug = require("debug");

const BOOTSTRAP_PORT = 51804;
const SIGNAL_PORT = 51805;

const logConsumer = (name) => (stream) => {
  const logInfo = createDebug(`e2e:${name}:info`);
  const logErr = createDebug(`e2e:${name}:error`);
  stream.on("data", logInfo);
  stream.on("err", logErr);
};

function startLocalServicesContainer(network) {
  return new GenericContainer("holoom/local-services")
    .withNetwork(network)
    .withEnvironment({
      BOOTSTRAP_PORT,
      SIGNAL_PORT,
    })
    .withLogConsumer(logConsumer("local-services"))
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
    .withLogConsumer(logConsumer("authority"))
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
    .withLogConsumer(logConsumer("holo-dev-server"))
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
    .withLogConsumer(logConsumer("rocket"))
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
    .withLogConsumer(logConsumer("external-id-attestor"))
    .withCommand(["npm", "start"])
    .start();
}

function startMockAuthContainer(network) {
  return new GenericContainer("holoom/mock-auth")
    .withNetwork(network)
    .withExposedPorts({ host: 3002, container: 3002 })
    .withEnvironment({ PORT: "3002" })
    .withLogConsumer(logConsumer("mock-auth"))
    .withCommand(["node", "index.js"])
    .start();
}

function startMockOracleContainer(network, authorityIp) {
  return new GenericContainer("holoom/mock-oracle")
    .withNetwork(network)
    .withExposedPorts({ host: 8001, container: 8001 })
    .withEnvironment({
      PORT: "8001",
      HOLOCHAIN_HOST_NAME: authorityIp,
      HOLOCHAIN_ADMIN_WS_PORT: 3334,
      HOLOCHAIN_APP_WS_PORT: 3336,
      HOLOCHAIN_APP_ID: "holoom",
    })
    .withLogConsumer(logConsumer("mock-oracle"))
    .withCommand(["npm", "start"])
    .start();
}

module.exports.startTestContainers = async (opts = {}) => {
  debug("Begin test container setup");
  const network = await new Network().start();
  const localServicesProm = startLocalServicesContainer(network);
  const localServicesIpProm = localServicesProm.then((localServices) =>
    localServices.getIpAddress(network.getName())
  );
  const authorityProm = localServicesIpProm.then(async (localServicesIp) => {
    const authority = startAuthorityContainer(network, localServicesIp);
    await new Promise((r) => setTimeout(r, 5_000));
    return authority;
  });
  const holoProm = localServicesIpProm.then(async (localServicesIp) => {
    await new Promise((r) => setTimeout(r, 10_000));
    return startHoloContainer(network, localServicesIp);
  });
  const authorityIpProm = authorityProm.then((authority) =>
    authority.getIpAddress(network.getName())
  );

  const containerProms = [localServicesProm, authorityProm, holoProm];

  if (opts.rocket) {
    containerProms.push(
      authorityIpProm.then((authorityIp) =>
        startRocketContainer(network, authorityIp)
      )
    );
  }

  if (opts.externalId) {
    const mockAuthProm = startMockAuthContainer(network);
    const externalIdAttestorProm = Promise.all([
      mockAuthProm,
      authorityIpProm,
    ]).then(([mockAuth, authorityIp]) => {
      const mockAuthIp = mockAuth.getIpAddress(network.getName());
      return startExternalIdAttestorContainer(network, authorityIp, mockAuthIp);
    });
    containerProms.push(mockAuthProm, externalIdAttestorProm);
  }

  if (opts.oracle) {
    containerProms.push(
      authorityIpProm.then((authorityIp) =>
        startMockOracleContainer(network, authorityIp)
      )
    );
  }

  const startedContainers = [];
  const failures = [];
  for (prom of containerProms) {
    try {
      startedContainers.push(await prom);
    } catch (err) {
      failures.push(err);
    }
  }

  const stop = async () => {
    debug("Begin test container teardown");
    await Promise.all(startedContainers.map((container) => container.stop()));
    await network.stop();
    debug("Finished test container teardown");
  };

  if (failures.length) {
    debug(`${failures.length} container(s) failed to start`);
    await stop();
    throw failures[0];
  }

  debug("Test container setup finished");

  return { stop };
};
