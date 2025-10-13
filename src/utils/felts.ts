export function bytesToFelt(bytes: Uint8Array): bigint {
  return new DataView(bytes.buffer).getBigUint64(0, true);
}

export function feltValueToUint8Array(value: bigint): Uint8Array {
  const hex = value.toString(16).padStart(16, "0");
  const u8 = new Uint8Array(8);
  for (let i = 0; i < 8; i++) {
    u8[8 - i - 1] = parseInt(hex.substr(i * 2, 2), 16);
  }
  return u8;
}
