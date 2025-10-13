import { hexToBytes, isHex } from "viem";
import { bytesToFelt, feltValueToUint8Array } from "./felts";

export function wordHexToFelts(
  wordHex: string
): [bigint, bigint, bigint, bigint] {
  if (!isHex(wordHex)) {
    throw new Error("Invalid word hex");
  }
  const word = hexToBytes(wordHex);

  if (word.length !== 32) {
    throw new Error("Invalid word bytes length");
  }

  const [felt1Bytes, felt2Bytes, felt3Bytes, felt4Bytes] = [
    word.slice(0, 8),
    word.slice(8, 16),
    word.slice(16, 24),
    word.slice(24, 32),
  ];
  const felt1 = bytesToFelt(felt1Bytes);
  const felt2 = bytesToFelt(felt2Bytes);
  const felt3 = bytesToFelt(felt3Bytes);
  const felt4 = bytesToFelt(felt4Bytes);

  return [felt1, felt2, felt3, felt4];
}

export function wordToHex(word: [bigint, bigint, bigint, bigint]): string {
  const bytes = Buffer.concat([
    feltValueToUint8Array(word[0]),
    feltValueToUint8Array(word[1]),
    feltValueToUint8Array(word[2]),
    feltValueToUint8Array(word[3]),
  ]);
  return `0x${bytes.toString("hex")}`;
}
