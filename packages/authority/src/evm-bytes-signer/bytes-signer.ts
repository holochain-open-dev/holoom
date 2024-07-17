import { bytesToBigInt, encodePacked, Hex, hexToBytes, keccak256 } from "viem";
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
    const packed = encodePacked(
      ["uint256[]"],
      [u256_array.map((u256, idx) => bytesToBigInt(u256))]
    );
    // I know it looks odd, but rain-lang expects the context to be double
    // hashed! (The second time happens during signing.)
    const raw = keccak256(packed);
    const hex = await this.account.signMessage({ message: { raw } });
    return formatEvmSignature(hex);
  }
}
