import { createContext } from "react";
import { PreswapService } from "../../../preswap/service";

export const PreswapContext = createContext<PreswapService>(
  new PreswapService([])
);
