import { Trade } from "@uniswap/v2-sdk";
import { PreswapRouteResponseItem, PreswapRoute } from "../../types";
import { Currency, TradeType } from "@uniswap/sdk-core";

export class UniV2PreswapQuote
  implements PreswapRouteResponseItem, PreswapRoute
{
  constructor(
    public readonly exactAmountOut: bigint,
    public readonly amountIn: bigint,
    public readonly fee: {
      tokenInAmount?: bigint;
      tokenOutAmount?: bigint;
      gasFee: bigint;
    },
    public readonly estimatedAt: number,
    public readonly validUntil: number,
    public readonly chainId: bigint,
    public readonly fromToken: {
      address: string;
      decimals: number;
    },
    public readonly toToken: {
      address: string;
      decimals: number;
    },
    public readonly targetTrade: Trade<
      Currency,
      Currency,
      TradeType.EXACT_OUTPUT
    >
  ) {}
}
