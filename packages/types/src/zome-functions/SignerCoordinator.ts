import { AppClient, Signature } from "@holochain/client";
import { SignableBytes } from "../types";
import { ValidationError } from "../errors";

export class SignerCoordinator {
  constructor(
    private readonly client: AppClient,
    private readonly roleName = "holoom",
    private readonly zomeName = "signer",
  ) {}

  async signMessage(payload: SignableBytes): Promise<Signature> {
    return this.client
      .callZome({
        role_name: this.roleName,
        zome_name: this.zomeName,
        fn_name: "sign_message",
        payload,
      })
      .catch(ValidationError.tryCastThrow);
  }
}
