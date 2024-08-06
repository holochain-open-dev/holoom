import { AppClient } from "@holochain/client";

export class PingCoordinator {
  constructor(
    private readonly client: AppClient,
    private readonly roleName = "holoom",
    private readonly zomeName = "ping",
  ) {}

  async ping(): Promise<void> {
    return this.client.callZome({
      role_name: this.roleName,
      zome_name: this.zomeName,
      fn_name: "ping",
      payload: null,
    });
  }
}
