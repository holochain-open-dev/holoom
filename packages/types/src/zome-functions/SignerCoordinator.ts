import { AppClient, Signature } from "@holochain/client";
import { SignableBytes } from "../types";
import { ValidationError } from "../errors";

export class SignerCoordinator {
  constructor(
    private readonly client: AppClient,
    private readonly roleName = "holoom",
    private readonly zomeName = "signer",
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

  async signMessage(message: SignableBytes): Promise<Signature> {
    return this.callFn("sign_message", message);
  }
}
