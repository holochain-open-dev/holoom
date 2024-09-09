import { callZomeFnHelper } from "../utils";
import { ActionHash, AppClient, Record } from "@holochain/client";

export class RecordsCoordinator {
  constructor(
    private readonly client: AppClient,
    private readonly roleName = "holoom",
    private readonly zomeName = "records",
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

  async getRecord(actionHash: ActionHash): Promise<Record | null> {
    return this.callZomeFn("get_record", actionHash);
  }
}
