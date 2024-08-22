import { AppClient, Signature } from "@holochain/client";
import { SignableBytes } from "../types";
import { callZomeAndTransformError } from "../call-zome-helper";

export class SignerCoordinator {
  constructor(
    private readonly client: AppClient,
    private readonly roleName = "holoom",
    private readonly zomeName = "signer",
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

  async signMessage(message: SignableBytes): Promise<Signature> {
    return this.callFn("sign_message", message);
  }
}
