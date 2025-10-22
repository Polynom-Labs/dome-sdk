import { createContext } from "react";
import { preswap } from "@dome-protocol/sdk";

export const PreswapContext = createContext<preswap.PreswapService>(
  new preswap.PreswapService([])
);
