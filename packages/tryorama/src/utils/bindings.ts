import { AppClient } from "@holochain/client";
import { Player } from "@holochain/tryorama";
import { UsernameRegistryCoordinator } from "@holoom/types";

export function bindCoordinators(player: Player) {
  const appClient = player.cells[0] as unknown as AppClient;
  return {
    usernameRegistry: new UsernameRegistryCoordinator(appClient),
  };
}
