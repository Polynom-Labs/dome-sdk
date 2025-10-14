import { generateDisperseScript } from ".";

const EXPECTED_DISPERSE_SCRIPT = `use.miden::tx
use.miden::contracts::wallets::basic
use.miden::contracts::auth

begin
\tpush.0x8f13f40555b1382d890e646242466d5d088b10696a73660192980b94c0e46559
\tpush.0
\tpush.2
\tpush.0
\tpush.4177657856
\tcall.tx::create_note

\tpush.0x40420f0000000000000000000000000020da1f45afd7c96300fdde0bce06fa00
\tcall.basic::move_asset_to_note dropw
\tdropw dropw dropw drop

\tpush.0xc63ad6622d2b7f9cec142ac1b0e8613f534d31e1dc76941ac335b9531baf9e98
\tpush.0
\tpush.2
\tpush.0
\tpush.4177657856
\tcall.tx::create_note

\tpush.0x80841e0000000000000000000000000020da1f45afd7c96300fdde0bce06fa00
\tcall.basic::move_asset_to_note dropw
\tdropw dropw dropw drop

\tcall.auth::basic::auth_tx_rpo_falcon512

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
