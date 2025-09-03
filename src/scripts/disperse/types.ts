export type DisperseArgs = {
  assetAccountId: string;
  tag?: bigint;
  shares: Array<{
    recipient: string;
    amount: bigint;
  }>;
};
