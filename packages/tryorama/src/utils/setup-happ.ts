import {
  AgentPubKey,
  AppBundleSource,
  encodeHashToBase64,
} from "@holochain/client";
import {
  Player,
  AgentApp,
  enableAndGetAgentApp,
  Scenario,
} from "@holochain/tryorama";
import yaml from "yaml";
import fs from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { spawn } from "node:child_process";

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

export async function setupBundleAndAuthorityPlayer(scenario: Scenario) {
  const conductor = await scenario.addConductor();
  const authorityAgentPubkey = await conductor.adminWs().generateAgentPubKey();

  const appBundleSource = await overrideHappBundle(authorityAgentPubkey);
  const appInfo = await conductor.installApp(appBundleSource, {
    networkSeed: scenario.networkSeed,
    agentPubKey: authorityAgentPubkey,
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
  const authority: Player = { conductor, appWs, ...agentApp };

  return { authority, appBundleSource };
}
