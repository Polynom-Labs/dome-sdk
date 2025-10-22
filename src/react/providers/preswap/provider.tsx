import { FC, PropsWithChildren, useEffect, useMemo } from "react";
import { PreswapContext } from "./context";
import { preswap } from "@dome-protocol/sdk";

import { useConfig, useWalletClient } from "wagmi";
import { getPublicClient } from "wagmi/actions";
import React from "react";

type UniswapV2PreswapProviderConfig = {
  type: "uniswap-v2";
} & preswap.uniswap.v2.UniV2PreswapProviderOptions;

type PreswapProviderProps = PropsWithChildren<{
  providers: Record<
    number,
    Omit<UniswapV2PreswapProviderConfig, "readClient" | "writeClient" | "chain">
  >;
}>;

export const PreswapProvider: FC<PropsWithChildren<PreswapProviderProps>> = ({
  children,
  providers,
}: PreswapProviderProps) => {
  const wagmiConfig = useConfig();
  const { data: writeClient } = useWalletClient();

  const preswapProviders = useMemo(() => {
    return preswap.PreswapService.create(
      Object.fromEntries(
        Object.entries(providers).map(([chainId, provider]) => {
          const chain = wagmiConfig.chains.find(
            (chain) => chain.id === Number(chainId)
          );
          if (!chain) {
            throw new Error(`Chain ${chainId} not found`);
          }

          const readClient = getPublicClient(wagmiConfig, {
            chainId: chain.id,
          });

          if (!readClient) {
            throw new Error(`Read client not found for chain ${chain.id}`);
          }

          if (provider.type === "uniswap-v2") {
            return [
              chainId,
              new preswap.uniswap.v2.UniV2PreswapProvider({
                ...provider,
                readClient,
                chain,
              }),
            ];
          }
          throw new Error(`Unknown provider type: ${provider.type}`);
        })
      )
    );
  }, [providers]);

  useEffect(() => {
    if (writeClient) {
      preswapProviders.updateWriteClient(writeClient);
    }
  }, [writeClient]);

  return (
    <PreswapContext.Provider value={preswapProviders}>
      {children}
    </PreswapContext.Provider>
  );
};
