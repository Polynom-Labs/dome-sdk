export type DisperseArgs = {
  assetAccountId: string | [bigint, bigint];
  tag?: bigint;
  shares: Array<{
    recipient: string;
    amount: bigint;
  }>;
};
