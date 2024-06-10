import { GenericContainer, StartedNetwork, StartedTestContainer } from "testcontainers";
import { debug } from "debug";

const BOOTSTRAP_PORT = "51804";
const SIGNAL_PORT = "51805";

export function startLocalServicesContainer(network) {
  return new GenericContainer("holoom/local-services")
    .withNetwork(network)
    .withEnvironment({
      BOOTSTRAP_PORT,
      SIGNAL_PORT,
    })
    .withCommand(["/run.sh"])
    .start();
}

export function startAuthorityContainer(network:StartedNetwork,localServicesIp:string) {
  return new GenericContainer("holoom/authority-agent-sandbox")
    .withNetwork(network)
    .withEnvironment({
      BOOTSTRAP_SERVER_OVERRIDE: `http://${localServicesIp}:${BOOTSTRAP_PORT}`,
      SIGNAL_SERVER_OVERRIDE: `ws://${localServicesIp}:${SIGNAL_PORT}`,
      ADMIN_WS_PORT_INTERNAL: "3333",
      ADMIN_WS_PORT_EXPOSED: "3334",
      APP_WS_PORT_INTERNAL: "3335",
      APP_WS_PORT_EXPOSED: "3336"
    })
    .withExposedPorts(
      { host: 3336, container: 3336 }
    )
    .withLogConsumer((stream) => {
      const logInfo = debug("e2e:authority:info");
      const logErr = debug("e2e:authority:error");
      stream.on("data", logInfo);
      stream.on("err", logErr);
    })
    .withCommand(["/run.sh"])
    .start();
}
