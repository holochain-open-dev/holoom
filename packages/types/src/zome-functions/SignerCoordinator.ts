import { callZomeFnHelper } from "../utils";
import { AppClient, Signature } from "@holochain/client";
import { SignableBytes } from "../types";

export class SignerCoordinator {
  constructor(
    private readonly client: AppClient,
    private readonly roleName = "holoom",
    private readonly zomeName = "signer",
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

  async signMessage(message: SignableBytes): Promise<Signature> {
    return this.callZomeFn("sign_message", message);
  }
}
