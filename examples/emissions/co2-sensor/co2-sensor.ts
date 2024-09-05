/**
 * A mock CO₂ sensor, that emits a random measure in grams roughly every 2
 * seconds. The "measurements" are published by a sandboxed holochain agent
 * that serves no other role in the network.
 */

import {
  ensureAndConnectToHapp,
  UsernameRegistryCoordinator,
} from "@holoom/authority";

async function main() {
  // Create a conductor sandbox (with holoom installed) at the specified
  // directory if it doesn't already exist, and connect to it.
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

  setInterval(() => publishMeasurement(usernameRegistryCoordinator), 1_000);
}

async function publishMeasurement(
  usernameRegistryCoordinator: UsernameRegistryCoordinator
) {
  const time = Math.floor(Date.now() / 1000);
  const name = `co2-sensor/time/${time}`;

  // A pretend measure of detected CO₂
  const gramsCo2 = Math.floor(Math.random() * 1000);
  try {
    await usernameRegistryCoordinator.createOracleDocument({
      name,
      json_data: JSON.stringify({ time, gramsCo2 }),
    });
    console.log("Published", time, gramsCo2);
  } catch (err) {
    console.error("Failed to publish reading with error:", err);
  }
}

main();
