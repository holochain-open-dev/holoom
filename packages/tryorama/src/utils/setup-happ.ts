import {
  AgentPubKey,
  AppBundleSource,
  encodeHashToBase64,
  fakeAgentPubKey,
} from "@holochain/client";
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
import { join } from "node:path";
import { tmpdir } from "node:os";
import { spawn } from "node:child_process";
import { bindCoordinators } from "./bindings";

export async function overrideHappBundle(
  authorityPubkey: AgentPubKey
): Promise<AppBundleSource> {
  const tmpWorkdir = await fs.mkdtemp(join(tmpdir(), "tryorama-workdir-"));
  await fs.copyFile("../../workdir/holoom.dna", join(tmpWorkdir, "holoom.dna"));

  const manifest = yaml.parse(
    await fs.readFile("../../workdir/happ.yaml", "utf8")
  );
  manifest.roles[0].dna.modifiers.properties = {
    authority_agent: encodeHashToBase64(authorityPubkey),
  };
  await fs.writeFile(join(tmpWorkdir, "happ.yaml"), yaml.stringify(manifest));

  const bundleProcess = spawn("hc", ["app", "pack", tmpWorkdir]);
  await new Promise<void>((resolve, reject) => {
    bundleProcess.stdout.on("end", resolve);
    bundleProcess.stderr.on("data", (err) => {
      console.error("hc app pack error:", new TextDecoder().decode(err));
      reject();
    });
  });
  return { path: join(tmpWorkdir, "holoom.happ") };
}

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
  return { conductor, appWs, ...agentApp };
}

export async function setupBundleAndAuthorityPlayer(scenario: Scenario) {
  const conductor = await addConductor(scenario);
  const authorityAgentPubkey = await conductor.adminWs().generateAgentPubKey();

  const appBundleSource = await overrideHappBundle(authorityAgentPubkey);
  const authority = await addPlayer(
    scenario,
    conductor,
    appBundleSource,
    authorityAgentPubkey
  );

  return { authority, appBundleSource };
}

export async function setupAuthorityOnly(scenario: Scenario) {
  const { authority } = await setupBundleAndAuthorityPlayer(scenario);
  const authorityCoordinators = bindCoordinators(authority);
  return { authority, authorityCoordinators };
}

export async function setupAuthorityAndAlice(scenario: Scenario) {
  const { authority, appBundleSource } =
    await setupBundleAndAuthorityPlayer(scenario);
  const alice = await addPlayer(
    scenario,
    await addConductor(scenario),
    appBundleSource
  );
  const authorityCoordinators = bindCoordinators(authority);
  const aliceCoordinators = bindCoordinators(alice);
  return { authority, alice, authorityCoordinators, aliceCoordinators };
}

export async function setupAliceOnly(scenario: Scenario) {
  const alice = await addPlayer(
    scenario,
    await addConductor(scenario),
    await overrideHappBundle(await fakeAgentPubKey())
  );
  const aliceCoordinators = bindCoordinators(alice);
  return { alice, aliceCoordinators };
}
