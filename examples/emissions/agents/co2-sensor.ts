/**
 * A mock CO₂ sensor, that emits a random measure in grams roughly every 2
 * seconds. The "measurements" are published by a sandboxed holochain agent
 * that serves no other role in the network.
 */

import { ensureAndConnectToHapp } from "@holoom/sandbox";
import { UsernameRegistryCoordinator } from "@holoom/types";
import { AgentPubKey } from "@holochain/client";

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
      iceServers: [
        "stun:stun-0.main.infra.holo.host:443",
        "stun:stun-1.main.infra.holo.host:443",
      ],
      ephemeralPorts: {
        min: "40000",
        max: "40255",
      },
      password: "password",
    }
  );
  const usernameRegistryCoordinator = new UsernameRegistryCoordinator(appWs);

  await ensureListedAsPublisher(appWs.myPubKey, usernameRegistryCoordinator);

  setInterval(() => publishMeasurement(usernameRegistryCoordinator), 1_000);
}

async function ensureListedAsPublisher(
  myPubkey: AgentPubKey,
  usernameRegistryCoordinator: UsernameRegistryCoordinator
) {
  const publishers = await usernameRegistryCoordinator.getAllPublishers();
  for (const [agent] of publishers) {
    if (arrEqual(agent, myPubkey)) {
      console.log("Already listed as publisher");
      return;
    }
  }
  console.log("Listing self as publisher");
  await usernameRegistryCoordinator.registerAsPublisher("co2-sensor");
}

function arrEqual(arr1: Uint8Array, arr2: Uint8Array): boolean {
  if (arr1.length !== arr2.length) return false;
  for (let i = 0; i < arr1.length; i++) {
    if (arr1[i] !== arr2[i]) return false;
  }
  return true;
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
