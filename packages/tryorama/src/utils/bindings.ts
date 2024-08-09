import { AppClient } from "@holochain/client";
import { Player } from "@holochain/tryorama";
import { UsernameRegistryCoordinator, SignerCoordinator } from "@holoom/client";

export function bindCoordinators(player: Player) {
  const appClient = player.cells[0] as unknown as AppClient;
  return {
    signer: new SignerCoordinator(appClient),
    usernameRegistry: new UsernameRegistryCoordinator(appClient),
  };
}
