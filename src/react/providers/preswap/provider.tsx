import { FC, PropsWithChildren, useEffect, useMemo } from "react";
import { PreswapService } from "../../../preswap/service";
import { PreswapContext } from "./context";
import { PreswapProviderOptions } from "../../../preswap/types";
import {
  UniV2PreswapProvider,
  UniV2PreswapProviderOptions,
} from "../../../preswap/uniswap/v2";

import React from "react";
import { useConfig, useWalletClient } from "wagmi";
import { getPublicClient } from "wagmi/actions";

type UniswapV2PreswapProviderConfig = {
  type: "uniswap-v2";
} & UniV2PreswapProviderOptions;

type PreswapProviderProps = PropsWithChildren<{
  providers: Record<
    number,
    Omit<PreswapProviderOptions, "readClient" | "writeClient" | "chain"> &
      UniswapV2PreswapProviderConfig
  >;
}>;

export const PreswapProvider: FC<PropsWithChildren<PreswapProviderProps>> = ({
  children,
  providers,
}: PreswapProviderProps) => {
  const wagmiConfig = useConfig();
  const { data: writeClient } = useWalletClient();

  const preswapProviders = useMemo(() => {
    return PreswapService.create(
      Object.fromEntries(
        Object.entries(providers).map(([chainId, provider]) => {
          const chain = wagmiConfig.chains.find(
            (chain) => chain.id === provider.chain.id
          );
          if (!chain) {
            throw new Error(`Chain ${provider.chain.id} not found`);
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
              new UniV2PreswapProvider({
                ...provider,
                readClient,
                chain: provider.chain,
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
