import { wordHexToFelts, wordToHex } from "./words";

describe("wordToHex", () => {
  it.each([
    {
      initialHex:
        "0x446da8c8fb61279d26e5ba4045ca3a07ee3a84b1ea0d130f92b0652ed8836ca9",
    },
    {
      initialHex:
        "0xcdfb5b9bf8b65f14126d53133cba63cbfe041ac84786ab1de110bd76b281fa0f",
    },
    {
      initialHex:
        "0xae3b86f4461ae1f2db035ce9f3ed27095bdd9e3a79b92a13bac4a5db00cc432b",
    },
  ])("Should encode hex $initialHex to felts revertable", ({ initialHex }) => {
    const word = wordHexToFelts(initialHex);
    const resultinHex = wordToHex(word);

    expect(resultinHex).toEqual(initialHex);
  });
});
