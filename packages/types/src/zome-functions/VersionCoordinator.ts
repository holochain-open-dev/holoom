import { AppClient } from "@holochain/client";

export class VersionCoordinator {
  constructor(
    private readonly client: AppClient,
    private readonly roleName = "holoom",
    private readonly zomeName = "version",
  ) {}

  async gitRev(): Promise<string> {
    return this.client.callZome({
      role_name: this.roleName,
      zome_name: this.zomeName,
      fn_name: "git_rev",
      payload: null,
    });
  }
}
