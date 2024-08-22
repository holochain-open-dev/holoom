import { ActionHash, AgentPubKey, AppClient, Record } from "@holochain/client";
import { AgentActivity } from "../dependency-types";
import {
  CreateAppEntryRawInput,
  CreateLinkRawInput,
} from "../typeshare-generated";
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

  async getChainStatus(agent: AgentPubKey): Promise<AgentActivity> {
    return this.callFn("get_chain_status", agent);
  }

  async getRecord(actionHash: ActionHash): Promise<Record | null> {
    return this.callFn("get_record", actionHash);
  }
}
