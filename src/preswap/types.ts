export interface PreswapRouteRequest {
  chainId: bigint;
  fromToken: {
    address: string | "native";
    decimals: number;
  };
  toToken: {
    address: string;
    decimals: number;
  };
  exactAmountOut: bigint;
}

export interface PreswapRoute {
  amountIn: bigint;
  fee: {
    tokenInAmount?: bigint;
    tokenOutAmount?: bigint;
    gasFee: bigint;
  };
  estimatedAt: number;
  validUntil: number;
}

export type PreswapRouteResponseItem = PreswapRoute & PreswapRouteRequest;

export interface PreswapProvider {
  getSupportedChainIds(): Array<bigint>;
  fetchRoutes(request: PreswapRouteRequest): Promise<Array<PreswapRoute>>;
  executeRoute(route: PreswapRouteResponseItem): Promise<void>;
}
