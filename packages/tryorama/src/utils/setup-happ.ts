import { AgentPubKey, AppBundleSource } from "@holochain/client";
import {
  Player,
  AgentApp,
  enableAndGetAgentApp,
  Scenario,
  createConductor,
  runLocalServices,
  Conductor,
} from "@holochain/tryorama";
import yaml from "yaml";
import fs from "node:fs/promises";
import path from "node:path";
import { bindCoordinators } from "./bindings";

export async function addConductor(scenario: Scenario) {
  if (!scenario.serviceProcess) {
    ({
      servicesProcess: scenario.serviceProcess,
      bootstrapServerUrl: scenario.bootstrapServerUrl,
      signalingServerUrl: scenario.signalingServerUrl,
    } = await runLocalServices());
  }
  const conductor = await createConductor(scenario.signalingServerUrl, {
    startup: false,
    bootstrapServerUrl: scenario.bootstrapServerUrl,
  });
  scenario.conductors.push(conductor);
  const conductorConfigPath = `${conductor.getTmpDirectory()}/conductor-config.yaml`;
  const conductorConfig = yaml.parse(
    await fs.readFile(conductorConfigPath, "utf8")
  );
  conductorConfig.dpki.no_dpki = true;
  await fs.writeFile(conductorConfigPath, yaml.stringify(conductorConfig));
  await conductor.startUp();
  return conductor;
}

export async function addPlayer(
  scenario: Scenario,
  conductor: Conductor,
  appBundleSource: AppBundleSource,
  agentPubKey?: AgentPubKey
): Promise<Player> {
  if (!agentPubKey) {
    agentPubKey = await conductor.adminWs().generateAgentPubKey();
  }

  const appInfo = await conductor.installApp(appBundleSource, {
    networkSeed: scenario.networkSeed,
    agentPubKey,
  });
  const adminWs = conductor.adminWs();
  const port = await conductor.attachAppInterface();
  const issued = await adminWs.issueAppAuthenticationToken({
    installed_app_id: appInfo.installed_app_id,
  });
  const appWs = await conductor.connectAppWs(issued.token, port);
  const agentApp: AgentApp = await enableAndGetAgentApp(
    adminWs,
    appWs,
    appInfo
  );
  return {
    conductor,
    appWs,
    ...agentApp,
    // `agentPubKey` was misleadingly typed as `Uint8Array` when it's actually
    // a node `Buffer`. Let's convert it into its purported type.
    agentPubKey: new Uint8Array(agentApp.agentPubKey),
  };
}

const APP_BUNDLE_SOURCE: AppBundleSource = {
  path: path.join(import.meta.dirname, "../../../../workdir/holoom.happ"),
};

export async function setupPlayer(scenario: Scenario) {
  const player = await addPlayer(
    scenario,
    await addConductor(scenario),
    APP_BUNDLE_SOURCE
  );
  const playerCoordinators = bindCoordinators(player);
  return [player, playerCoordinators] as const;
}
