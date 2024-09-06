import * as fs from "node:fs/promises";
import { spawn, ChildProcessWithoutNullStreams } from "node:child_process";
import yaml from "yaml";

export interface SandboxOptions {
  bootstrapServerUrl: URL;
  signalingServerUrl: URL;
  password: string;
}

/**
 * Creates a sandbox by invoking `hc sandbox create` at the specified directory
 * if the directory doesn't already exist.
 *
 * @param path The directory of the conductor sandbox
 * @param options Configuration for the sandbox
 */
export async function ensureSandbox(path: string, options: SandboxOptions) {
  const exists = await fs
    .stat(path)
    .then(() => true)
    .catch(() => false);
  if (!exists) {
    await createSandbox(path, options);
  }
}

/**
 *  Creates a sandbox by invoking `hc sandbox create` at the specified
 *  directory.
 *
 * @param path The directory of the conductor sandbox
 * @param options Configuration for the sandbox
 */
export async function createSandbox(path: string, options: SandboxOptions) {
  const pathComps = path.split("/");
  const sandboxDirName = pathComps.pop();
  const parentPath = pathComps.join("/") || "/";
  if (!sandboxDirName) {
    throw new Error(`Invalid sandbox path: '${path}'`);
  }
  const args = [
    "sandbox",
    "--piped",
    "create",
    "--root",
    parentPath,
    "-d",
    sandboxDirName,
    "--in-process-lair",
    "network",
  ];
  if (options?.bootstrapServerUrl) {
    args.push("--bootstrap", options.bootstrapServerUrl.href);
  }
  args.push("webrtc");
  args.push(options.signalingServerUrl.href);

  const createConductorProcess = spawn("hc", args);
  createConductorProcess.stdin.write(options.password);
  createConductorProcess.stdin.end();

  const createConductorPromise = new Promise<void>((resolve, reject) => {
    createConductorProcess.stdout.on("data", (data: Buffer) => {
      console.debug(`creating conductor config\n${data.toString()}`);
      const tmpDirMatches = [
        ...data.toString().matchAll(/ConfigRootPath\("(.*?)"\)/g),
      ];
      if (tmpDirMatches.length) {
        const actualDir = tmpDirMatches[0][1];
        if (path !== actualDir) {
          const err = new Error(
            `Unexpected sandbox dir '${actualDir}' instead of '${path}'`
          );
          console.error(err);
        }
      }
    });
    createConductorProcess.stdout.on("end", () => {
      resolve();
    });
    createConductorProcess.stderr.on("data", (err) => {
      console.error(`error when creating conductor config: ${err}\n`);
      reject(err);
    });
  });
  await createConductorPromise;

  // Disable dpki
  const conductorConfigPath = `${path}/conductor-config.yaml`;
  const conductorConfig = yaml.parse(
    await fs.readFile(conductorConfigPath, "utf8")
  );
  conductorConfig.dpki.no_dpki = true;
  await fs.writeFile(conductorConfigPath, yaml.stringify(conductorConfig));
}

/**
 * Starts the sandbox's conductor
 *
 * @param path The path to the sandbox
 * @param password The password on the sandbox
 * @returns A handle on the conductor process and the conductor's admin API
 * websocket url
 */
export async function startSandbox(
  path: string,
  password: string
): Promise<{ adminApiUrl: URL; process: ChildProcessWithoutNullStreams }> {
  const process = spawn("hc", ["sandbox", "--piped", "run", "-e", path]);
  process.stdin.write(password);
  process.stdin.end();

  let adminPort = "";
  const startPromise = new Promise<void>((resolve) => {
    process.stdout.on("data", (data: Buffer) => {
      const conductorLaunched = data
        .toString()
        .match(/Conductor launched #!\d ({.*})/);
      const holochainRunning = data
        .toString()
        .includes("Connected successfully to a running holochain");
      if (conductorLaunched || holochainRunning) {
        if (conductorLaunched) {
          const portConfiguration = JSON.parse(conductorLaunched[1]);
          adminPort = portConfiguration.admin_port;
          console.debug(`starting conductor\n${data}`);
        }
        if (holochainRunning) {
          // this is the last output of the startup process
          resolve();
        }
      } else {
        console.info(data.toString());
      }
    });

    process.stderr.on("data", (data: Buffer) => {
      console.info(data.toString());
    });
  });
  await startPromise;
  if (!adminPort) {
    throw new Error("Admin port not captured");
  }
  return { process, adminApiUrl: new URL(`http://localhost:${adminPort}`) };
}

/**
 * Shuts down the given conductor process.
 * @param process The conductor process
 */
export async function endSandboxProcess(
  process: ChildProcessWithoutNullStreams
) {
  console.debug("shutting down conductor\n");
  const conductorShutDown = new Promise<number | null>((resolve) => {
    process.on("exit", (code) => {
      process?.removeAllListeners();
      process?.stdout.removeAllListeners();
      process?.stderr.removeAllListeners();
      resolve(code);
    });
    process.kill("SIGINT");
  });
  return conductorShutDown;
}
