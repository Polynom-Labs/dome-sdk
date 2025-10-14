import type { DisperseArgs } from "./types";
import { accountIdHexToFelts, wordHexToFelts, wordToHex } from "../../utils";

const DEFAULT_TAG = 4177657856n;

type NormalizedArgs = {
  tag: string;
  shares: Array<{
    recipient: `0x${string}`;
    asset: `0x${string}`;
  }>;
};

export function generateDisperseScript({
  assetAccountId,
  tag = DEFAULT_TAG,
  shares,
}: DisperseArgs): string {
  const assetFelts = accountIdHexToFelts(assetAccountId);
  const normalizedShares: NormalizedArgs["shares"] = shares.map((share) => {
    return {
      recipient: share.recipient as `0x${string}`,
      asset: wordToHex([
        share.amount,
        BigInt(0),
        assetFelts[0],
        assetFelts[1],
      ]) as `0x${string}`,
    };
  });

  let script = "";
  script += `use.miden::tx
use.miden::contracts::wallets::basic
use.miden::contracts::auth

begin
`;

  normalizedShares.forEach((share) => {
    script += `\tpush.${share.recipient}
\tpush.0
\tpush.2
\tpush.0
\tpush.${tag}
\tcall.tx::create_note

\tpush.${share.asset}
\tcall.basic::move_asset_to_note dropw
\tdropw dropw dropw drop

`;
  });

  script += "\tcall.auth::basic::auth_tx_rpo_falcon512";
  script += "\n\nend";

  return script;
}

export { type DisperseArgs } from "./types";
