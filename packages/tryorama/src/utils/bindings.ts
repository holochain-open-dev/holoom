import { AppClient } from "@holochain/client";
import { Player } from "@holochain/tryorama";
import {
  UsernameRegistryCoordinator,
  SignerCoordinator,
  RecordsCoordinator,
} from "@holoom/types";
import { untilCoordinatorsReady } from "./ready";

export interface BoundCoordinators {
  records: RecordsCoordinator;
  signer: SignerCoordinator;
  usernameRegistry: UsernameRegistryCoordinator;
}

export async function bindCoordinators(
  player: Player,
  waitUntilReady = true
): Promise<BoundCoordinators> {
  const appClient = player.cells[0] as unknown as AppClient;
  const coordinators = {
    records: new RecordsCoordinator(appClient),
    signer: new SignerCoordinator(appClient),
    usernameRegistry: new UsernameRegistryCoordinator(appClient),
  };
  if (waitUntilReady) {
    await untilCoordinatorsReady(coordinators, player.agentPubKey);
  }
  return coordinators;
}
