import { bytesToBigInt, encodePacked, Hex, hexToBytes } from "viem";
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
    const message = encodePacked(
      ["uint256[]"],
      [u256_array.map((u256) => bytesToBigInt(u256))]
    );
    const hex = await this.account.signMessage({ message });
    return formatEvmSignature(hex);
  }
}
