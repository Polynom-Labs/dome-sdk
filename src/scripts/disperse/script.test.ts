import { generateDisperseScript } from ".";

const EXPECTED_DISPERSE_SCRIPT = `use.miden::tx
use.miden::contracts::wallets::basic

begin
\tpush.6441806357792004242.100894942528834312.6732114268921269897.3258549309132772239
\tpush.0
\tpush.0
\tpush.0
\tpush.4177657856
\tcall.tx::create_note

\tpush.7190515427852671520.70376226209856768.0.1000000
\tcall.basic::move_asset_to_note dropw
\tdropw dropw dropw drop

\tpush.10997419871988954563.1915286432582290771.4567187342983042284.11276779465890740934
\tpush.0
\tpush.0
\tpush.0
\tpush.4177657856
\tcall.tx::create_note

\tpush.7190515427852671520.70376226209856768.0.2000000
\tcall.basic::move_asset_to_note dropw
\tdropw dropw dropw drop

end`;

describe("disperse", () => {
  it("should generate a disperse script", () => {
    const script = generateDisperseScript({
      assetAccountId: "0x63c9d7af451fda2000fa06ce0bdefd",
      shares: [
        {
          recipient:
            "0x8f13f40555b1382d890e646242466d5d088b10696a73660192980b94c0e46559",
          amount: 1000000n,
        },
        {
          recipient:
            "0xc63ad6622d2b7f9cec142ac1b0e8613f534d31e1dc76941ac335b9531baf9e98",
          amount: 2000000n,
        },
      ],
    });
    expect(script).toBe(EXPECTED_DISPERSE_SCRIPT);
  });
});
