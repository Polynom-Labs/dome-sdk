import { createContext } from "react";
import { PreswapService } from "../../../preswap";

export const PreswapContext = createContext<PreswapService>(
  new PreswapService([])
);
