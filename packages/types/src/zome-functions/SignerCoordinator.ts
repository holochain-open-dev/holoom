import { AppClient, Signature } from "@holochain/client";
import { SignableBytes } from "../types";

export class SignerCoordinator {
  constructor(
    private readonly client: AppClient,
    private readonly roleName = "holoom",
    private readonly zomeName = "signer_coordinator",
  ) {}

  async signMessage(payload: SignableBytes): Promise<Signature> {
    return this.client.callZome({
      role_name: this.roleName,
      zome_name: this.zomeName,
      fn_name: "sign_message",
      payload,
    });
  }
}
