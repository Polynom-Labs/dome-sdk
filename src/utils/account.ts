import { hexToBytes, isHex } from "viem";
import { bytesToFelt } from "./felts";

export function accountIdHexToFelts(accountIdHex: string): [bigint, bigint] {
  if (!isHex(accountIdHex)) {
    throw new Error("Invalid account id hex");
  }
  const accountId = hexToBytes(accountIdHex);
  if (accountId.length !== 15) {
    throw new Error("Invalid account id bytes length");
  }

  const [felt1Bytes, felt2Bytes] = [
    accountId.slice(0, 8).reverse(),
    new Uint8Array([0, ...accountId.slice(8, 15).reverse()]),
  ];

  const felt1 = bytesToFelt(felt1Bytes);
  const felt2 = bytesToFelt(felt2Bytes);
  return [felt1, felt2];
}
