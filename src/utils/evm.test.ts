import { evmAddressToFelts } from "./evm";

describe("evmAddressToFelts", () => {
  it("Should serialize evm addresses to felts", () => {
    const address = "0x58de221108ebf6ee0c28c7685e26487837f452e8";
    const felts = evmAddressToFelts(address);
    expect(felts).toEqual([
      17219208645177433688n,
      8667219669801183244n,
      3897750583n,
    ]);
  });
});
