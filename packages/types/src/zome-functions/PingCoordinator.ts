import { AppClient } from "@holochain/client";
import { ValidationError } from "../errors";

export class PingCoordinator {
  constructor(
    private readonly client: AppClient,
    private readonly roleName = "holoom",
    private readonly zomeName = "ping",
  ) {}

  callFn(fn_name: string, payload?: unknown) {
    return this.client
      .callZome({
        role_name: this.roleName,
        zome_name: this.zomeName,
        fn_name,
        payload,
      })
      .catch(ValidationError.tryCastThrow);
  }

  async ping(): Promise<void> {
    return this.callFn("ping");
  }
}
