import { AppClient, ActionHash, Record } from "@holochain/client";

export class RecordsCoordinator {
  constructor(
    private readonly client: AppClient,
    private readonly roleName = "holoom",
    private readonly zomeName = "records_coordinator",
  ) {}

  async getRecord(payload: ActionHash): Promise<Record | null> {
    return this.client.callZome({
      role_name: this.roleName,
      zome_name: this.zomeName,
      fn_name: "get_record",
      payload,
    });
  }
}
