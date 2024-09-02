import { AppClient } from "@holochain/client";
import { Player } from "@holochain/tryorama";
import {
  UsernameRegistryCoordinator,
  SignerCoordinator,
  VersionCoordinator,
} from "@holoom/types";

export function bindCoordinators(player: Player) {
  const appClient = player.appWs as AppClient;
  return {
    signer: new SignerCoordinator(appClient),
    usernameRegistry: new UsernameRegistryCoordinator(appClient),
    version: new VersionCoordinator(appClient),
  };
}
