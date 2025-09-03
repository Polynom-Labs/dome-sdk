import type { DisperseArgs } from "./types";
import { accountIdHexToFelts, wordHexToFelts } from "../../utils";

const DEFAULT_TAG = 4177657856n;

type NormalizedArgs = {
  tag: string;
  shares: Array<{
    recipient: `${string}.${string}.${string}.${string}`;
    asset: `${string}.${string}.0.${string}`;
  }>;
};

export function generateDisperseScript({
  assetAccountId,
  tag = DEFAULT_TAG,
  shares,
}: DisperseArgs): string {
  const assetFelts = accountIdHexToFelts(assetAccountId);
  const normalizedShares: NormalizedArgs["shares"] = shares.map((share) => {
    const recipientFelts = wordHexToFelts(share.recipient).reverse();
    return {
      recipient: `${recipientFelts[0]}.${recipientFelts[1]}.${recipientFelts[2]}.${recipientFelts[3]}`,
      asset: `${assetFelts[0]}.${assetFelts[1]}.0.${share.amount.toString(10)}`,
    };
  });

  let script = "";
  script += `use.miden::tx
use.miden::contracts::wallets::basic

begin
`;

  normalizedShares.forEach((share) => {
    script += `\tpush.${share.recipient}
\tpush.0
\tpush.0
\tpush.0
\tpush.${tag}
\tcall.tx::create_note

\tpush.${share.asset}
\tcall.basic::move_asset_to_note dropw
\tdropw dropw dropw drop

`;
  });

  script += "end";

  return script;
}

export { type DisperseArgs } from "./types";
