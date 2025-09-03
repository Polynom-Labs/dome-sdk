export function bytesToFelt(bytes: Uint8Array): bigint {
  return new DataView(bytes.buffer).getBigUint64(0, true);
}
