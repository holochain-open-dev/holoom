import { AppClient } from "@holochain/client";
import { callZomeAndTransformError } from "../call-zome-helper";

export class PingCoordinator {
  constructor(
    private readonly client: AppClient,
    private readonly roleName = "holoom",
    private readonly zomeName = "ping",
  ) {}

  callFn(fn_name: string, payload?: unknown) {
    return callZomeAndTransformError(
      this.client,
      this.roleName,
      this.zomeName,
      fn_name,
      payload,
    );
  }

  async ping(): Promise<void> {
    return this.callFn("ping");
  }
}
