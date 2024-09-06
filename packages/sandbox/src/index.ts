import { AdminWebsocket } from "@holochain/client";
import {
  endSandboxProcess,
  ensureSandbox,
  SandboxOptions,
  startSandbox,
} from "./sandbox";
import { ensureHapp } from "./happ";
export * from "./happ";
export * from "./sandbox";

export async function ensureAndConnectToHapp(
  sandboxPath: string,
  happPath: string,
  networkSeed: string,
  options: SandboxOptions
) {
  await ensureSandbox(sandboxPath, options);

  const { process, adminApiUrl } = await startSandbox(
    sandboxPath,
    options.password
  );

  const adminWs = await AdminWebsocket.connect({
    url: adminApiUrl,
    wsClientOptions: { origin: "holoom" },
  });
  console.debug(`connected to Admin API @ ${adminApiUrl.href}\n`);

  const appWs = await ensureHapp(adminWs, happPath, networkSeed);

  const shutdown = async () => {
    await adminWs.client.close();
    await appWs.client.close();
    await endSandboxProcess(process);
  };

  return {
    adminWs,
    appWs,
    shutdown,
  };
}
