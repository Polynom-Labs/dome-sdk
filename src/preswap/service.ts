import { WalletClient } from "viem";
import {
  PreswapProvider,
  PreswapRouteRequest,
  PreswapRouteResponseItem,
} from "./types";

export class PreswapService {
  constructor(private readonly providers: Array<PreswapProvider<any>>) {}

  static create(
    providers:
      | Map<string | number, PreswapProvider<any>>
      | Record<string | number, PreswapProvider<any>>
  ): PreswapService {
    if (providers instanceof Map) {
      return new PreswapService(Array.from(providers.values()));
    }
    return new PreswapService(Object.values(providers));
  }

  updateWriteClient(writeClient: WalletClient): void {
    this.providers.forEach((provider) => {
      provider.setWriteClient(writeClient);
    });
  }

  async getRoutes(
    request: PreswapRouteRequest
  ): Promise<PreswapRouteResponseItem[]> {
    const provider = this.providers.find((provider) =>
      provider.getSupportedChainIds().includes(request.chainId)
    );
    if (!provider) {
      throw new Error(`No providers found for chain ${request.chainId}`);
    }
    return provider.fetchRoutes(request);
  }

  async executeRoute(route: PreswapRouteResponseItem): Promise<void> {
    const provider = this.providers.find((provider) =>
      provider.getSupportedChainIds().includes(route.chainId)
    );
    if (!provider) {
      throw new Error(`No providers found for chain ${route.chainId}`);
    }
    return provider.executeRoute(route);
  }
}
