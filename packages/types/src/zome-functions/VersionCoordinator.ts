import { callZomeFnHelper } from "../utils";
import { AppClient } from "@holochain/client";

export class VersionCoordinator {
  constructor(
    private readonly client: AppClient,
    private readonly roleName = "holoom",
    private readonly zomeName = "version",
  ) {}

  callZomeFn(fnName: string, payload?: unknown) {
    return callZomeFnHelper(
      this.client,
      this.roleName,
      this.zomeName,
      fnName,
      payload,
    );
  }

  async gitRev(): Promise<string> {
    return this.callZomeFn("git_rev");
  }
}
