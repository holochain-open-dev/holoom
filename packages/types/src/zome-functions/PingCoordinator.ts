import { callZomeFnHelper } from "../utils";
import { AppClient } from "@holochain/client";

export class PingCoordinator {
  constructor(
    private readonly client: AppClient,
    private readonly roleName = "holoom",
    private readonly zomeName = "ping",
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

  async ping(): Promise<void> {
    return this.callZomeFn("ping");
  }
}
