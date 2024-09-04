import {
  ensureAndConnectToHapp,
  UsernameRegistryCoordinator,
} from "@holoom/authority";

async function main() {
  const { appWs } = await ensureAndConnectToHapp(
    "/sandbox",
    "/workdir/holoom.happ",
    "emissions-local-test-2024-09-04T12:59",
    {
      bootstrapServerUrl: new URL("https://bootstrap-0.infra.holochain.org"),
      signalingServerUrl: new URL("wss://sbd-0.main.infra.holo.host"),
      password: "password",
    }
  );
  const usernameRegistryCoordinator = new UsernameRegistryCoordinator(appWs);

  while (true) {
    const time = Math.floor(Date.now() / 1000);
    const gramsCo2 = Math.floor(Math.random() * 1000);
    await usernameRegistryCoordinator.createOracleDocument({
      name: `co2-sensor/${time}`,
      json_data: JSON.stringify({ time, gramsCo2 }),
    });
    console.log("published", time, gramsCo2);
    await new Promise((r) => setTimeout(r, 2000));
  }
}

main();
