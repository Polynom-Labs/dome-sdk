import { useContext } from "react";
import { PreswapContext } from "./context";

export function usePreswap() {
  const preswapService = useContext(PreswapContext);

  return preswapService;
}
