import { hexToBytes, isAddress } from "viem";
import { bytesToFelt } from "./felts";

export function evmAddressToFelts(address: string): [bigint, bigint, bigint] {
  if (!isAddress(address)) {
    throw new Error("Invalid EVM address");
  }
  const addressBytes = hexToBytes(address);
  const [felt1Bytes, felt2Bytes, felt3Bytes] = [
    addressBytes.slice(0, 8),
    addressBytes.slice(8, 16),
    new Uint8Array([...addressBytes.slice(16, 20), 0, 0, 0, 0]),
  ];

  const felt1 = bytesToFelt(felt1Bytes);
  const felt2 = bytesToFelt(felt2Bytes);
  const felt3 = bytesToFelt(felt3Bytes);

  return [felt1, felt2, felt3];
}
