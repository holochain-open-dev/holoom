import { ActionHash, AppClient, Record } from "@holochain/client";
import {
  CreateAppEntryRawInput,
  CreateLinkRawInput,
} from "../typeshare-generated";
import { callZomeAndTransformError } from "../call-zome-helper";

export class RecordsCoordinator {
  constructor(
    private readonly client: AppClient,
    private readonly roleName = "holoom",
    private readonly zomeName = "records",
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

  async createAppEntryRaw(input: CreateAppEntryRawInput): Promise<ActionHash> {
    return this.callFn("create_app_entry_raw", input);
  }

  async createLinkRaw(input: CreateLinkRawInput): Promise<ActionHash> {
    return this.callFn("create_link_raw", input);
  }

  async deleteEntryRaw(actionHash: ActionHash): Promise<ActionHash> {
    return this.callFn("delete_entry_raw", actionHash);
  }

  async deleteLinkRaw(createLinkActionHash: ActionHash): Promise<ActionHash> {
    return this.callFn("delete_link_raw", createLinkActionHash);
  }

  async getRecord(actionHash: ActionHash): Promise<Record | null> {
    return this.callFn("get_record", actionHash);
  }
}
