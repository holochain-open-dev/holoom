import { Hex, hexToBytes } from "viem";
import { privateKeyToAccount, PrivateKeyAccount } from "viem/accounts";
import { formatEvmSignature } from "./utils.js";

export class BytesSigner {
  readonly account: PrivateKeyAccount;
  readonly address: Uint8Array;
  constructor(readonly privateKey: string) {
    this.account = privateKeyToAccount(privateKey as Hex);
    this.address = hexToBytes(this.account.address);
  }

  async sign(u256_array: Uint8Array[]) {
    console.log("signing u256_array", u256_array);
    const packed = new Uint8Array(
      u256_array.flatMap((u256) => Array.from(u256))
    );
    if (packed.length !== 32 * u256_array.length) {
      throw Error("Bad packing of u256_array");
    }
    const hex = await this.account.signMessage({ message: { raw: packed } });
    return formatEvmSignature(hex);
  }
}
