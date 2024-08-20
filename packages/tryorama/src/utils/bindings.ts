import { AppClient } from "@holochain/client";
import { Player } from "@holochain/tryorama";
import {
  UsernameRegistryCoordinator,
  SignerCoordinator,
  RecordsCoordinator,
} from "@holoom/types";

export function bindCoordinators(player: Player) {
  const appClient = player.cells[0] as unknown as AppClient;
  return {
    records: new RecordsCoordinator(appClient),
    signer: new SignerCoordinator(appClient),
    usernameRegistry: new UsernameRegistryCoordinator(appClient),
  };
}

export type BoundCoordinators = ReturnType<typeof bindCoordinators>;
