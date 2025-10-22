import { type Chain, type PublicClient, type WalletClient } from "viem";

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

export interface PreswapProviderOptions {
  chain: Chain;
  readClient: PublicClient;
  writeClient?: WalletClient;
  txConfirmations?: number;
}

export abstract class PreswapProvider<O extends PreswapProviderOptions> {
  abstract getSupportedChainIds(): Array<bigint>;
  fetchRoutes(
    request: PreswapRouteRequest
  ): Promise<Array<PreswapRouteResponseItem>> {
    if (BigInt(this.options.chain.id) !== request.chainId) {
      throw new Error(
        `Chain ID mismatch: ${this.options.chain.id} !== ${request.chainId}`
      );
    }
    return this.doFetchRoutes(request);
  }

  abstract doFetchRoutes(
    request: PreswapRouteRequest
  ): Promise<Array<PreswapRouteResponseItem>>;

  abstract doExecuteRoute(route: PreswapRouteResponseItem): Promise<void>;

  executeRoute(route: PreswapRouteResponseItem): Promise<void> {
    if (BigInt(this.options.chain.id) !== route.chainId) {
      throw new Error(
        `Chain ID mismatch: ${this.options.chain.id} !== ${route.chainId}`
      );
    }
    if (!this.options.writeClient) {
      throw new Error("Write client not set");
    }

    return this.doExecuteRoute(route);
  }

  public setWriteClient(writeClient: WalletClient): void {
    if (
      writeClient.chain &&
      BigInt(writeClient.chain.id) !== BigInt(this.options.chain.id)
    ) {
      this.options.writeClient = undefined;
    } else {
      this.options.writeClient = writeClient;
    }
  }

  constructor(protected readonly options: O) {}
}
