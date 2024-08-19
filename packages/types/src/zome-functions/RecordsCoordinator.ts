import { ActionHash, AppClient, Record } from "@holochain/client";
import { ValidationError } from "../errors";

export class RecordsCoordinator {
  constructor(
    private readonly client: AppClient,
    private readonly roleName = "holoom",
    private readonly zomeName = "records",
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

  async getRecord(actionHash: ActionHash): Promise<Record | null> {
    return this.callFn("get_record", actionHash);
  }
}
