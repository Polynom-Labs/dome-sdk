import {
  CurrencyAmount,
  Percent,
  Token,
  TradeType,
  WETH9,
} from "@uniswap/sdk-core";
import { Pair, Route, Trade } from "@uniswap/v2-sdk";
import {
  PreswapProvider,
  PreswapProviderOptions,
  PreswapRouteRequest,
  PreswapRouteResponseItem,
} from "../../types";
import { parseAbi, isAddress, erc20Abi, parseUnits } from "viem";
import {
  waitForTransactionReceipt,
  readContract,
  writeContract,
  getFeeHistory,
} from "viem/actions";
import { UniV2PreswapQuote } from "./UniV2PreswapQuote";

const POOL_RAW_ABI = parseAbi([
  "function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)",
]);

const SWAP_ROUTER_RAW_ABI = parseAbi([
  "function swapTokensForExactTokens(uint amountOut, uint amountInMax, address[] calldata path, address to,uint deadline) external returns (uint[] memory amounts)",
  "function swapETHForExactTokens(uint amountOut, address[] calldata path, address to, uint deadline) external payable returns (uint[] memory amounts)",
]);

const SINGLE_HOP_SWAP_GAS_LIMIT = 127_000n;

export interface UniV2PreswapProviderOptions extends PreswapProviderOptions {
  swapRouterAddress: string;
  quoteValidityMs?: number;
  wethAddress?: string;
  slippageTolerance?: number;
}

export class UniV2PreswapProvider extends PreswapProvider<UniV2PreswapProviderOptions> {
  private readonly quoteValidityMs: number;
  private readonly wethAddress: string;
  private readonly swapRouterAddress: string;
  private readonly slippageTolerance: number;

  constructor(options: UniV2PreswapProviderOptions) {
    super(options);

    const {
      quoteValidityMs = 1000 * 60 * 3,
      wethAddress = WETH9[options.chain.id].address,
      swapRouterAddress,
      txConfirmations = 5,
      slippageTolerance = 50,
    } = options;
    this.quoteValidityMs = quoteValidityMs;
    if (!isAddress(wethAddress)) {
      throw new Error("Invalid WETH address");
    }
    if (this.options.txConfirmations == null) {
      this.options.txConfirmations = txConfirmations;
    }
    this.wethAddress = wethAddress;
    this.swapRouterAddress = swapRouterAddress;
    this.slippageTolerance = slippageTolerance;
  }

  getSupportedChainIds(): Array<bigint> {
    return [BigInt(this.options.chain.id)];
  }

  async doExecuteRoute(route: PreswapRouteResponseItem): Promise<void> {
    if (!(route instanceof UniV2PreswapQuote)) {
      throw new Error("Invalid route");
    }

    if (Date.now() > route.validUntil) {
      throw new Error("Quote expired");
    }

    const { fromToken, toToken, amountIn, exactAmountOut } = route;

    if (fromToken.address === "native") {
      fromToken.address = this.wethAddress;
    }

    const isTokenInIsWeth =
      fromToken.address.toLowerCase() === this.wethAddress.toLowerCase();
    const recipient = this.options.writeClient!.account!.address;
    const path = [
      fromToken.address as `0x${string}`,
      toToken.address as `0x${string}`,
    ];

    if (isTokenInIsWeth) {
      const tx = await writeContract(this.options.writeClient!, {
        address: this.swapRouterAddress as `0x${string}`,
        abi: SWAP_ROUTER_RAW_ABI,
        functionName: "swapETHForExactTokens",
        args: [
          exactAmountOut,
          path,
          recipient,
          BigInt(Math.floor(Date.now() / 1000) + 1800),
        ],
        chain: this.options.chain,
        account: this.options.writeClient!.account!,
        value: amountIn,
      });
      await waitForTransactionReceipt(this.options.readClient, {
        hash: tx,
        confirmations: this.options.txConfirmations,
      });
    } else {
      const allowance = await readContract(this.options.readClient, {
        address: fromToken.address as `0x${string}`,
        abi: erc20Abi,
        functionName: "allowance",
        args: [
          this.options.writeClient!.account!.address as `0x${string}`,
          this.swapRouterAddress as `0x${string}`,
        ],
      });

      if (amountIn > allowance) {
        const tx = await writeContract(this.options.writeClient!, {
          address: fromToken.address as `0x${string}`,
          abi: erc20Abi,
          functionName: "approve",
          args: [this.swapRouterAddress as `0x${string}`, amountIn],
          chain: this.options.writeClient!.chain,
          account: this.options.writeClient!.account!,
        });
        await waitForTransactionReceipt(this.options.readClient, {
          hash: tx,
          confirmations: this.options.txConfirmations,
        });
      }
      const tx = await writeContract(this.options.writeClient!, {
        address: this.swapRouterAddress as `0x${string}`,
        abi: SWAP_ROUTER_RAW_ABI,
        functionName: "swapTokensForExactTokens",
        args: [
          exactAmountOut,
          amountIn,
          path,
          recipient,
          BigInt(Math.floor(Date.now() / 1000) + 1800),
        ],
        chain: this.options.writeClient!.chain,
        account: this.options.writeClient!.account!,
      });
      await waitForTransactionReceipt(this.options.readClient, {
        hash: tx,
        confirmations: this.options.txConfirmations,
      });
    }
  }

  private async createPair(tokenIn: Token, tokenOut: Token): Promise<Pair> {
    const pairAddress = Pair.getAddress(tokenIn, tokenOut) as `0x${string}`;

    const reserves = await readContract(this.options.readClient, {
      address: pairAddress,
      abi: POOL_RAW_ABI,
      functionName: "getReserves",
    });
    const [reserve0, reserve1] = reserves;

    const tokens = [tokenIn, tokenOut];
    const [token0, token1] = tokens[0].sortsBefore(tokens[1])
      ? tokens
      : [tokens[1], tokens[0]];

    return new Pair(
      CurrencyAmount.fromRawAmount(token0, reserve0.toString()),
      CurrencyAmount.fromRawAmount(token1, reserve1.toString())
    );
  }

  async doFetchRoutes({
    exactAmountOut,
    fromToken: { address: addressIn, decimals: decimalsIn },
    toToken: { address: addressOut, decimals: decimalsOut },
  }: PreswapRouteRequest): Promise<Array<PreswapRouteResponseItem>> {
    const tokenIn = new Token(
      this.options.chain.id,
      addressIn === "native" ? this.wethAddress : addressIn,
      decimalsIn
    );
    const tokenOut = new Token(this.options.chain.id, addressOut, decimalsOut);

    const pair = await this.createPair(tokenIn, tokenOut);
    const route = new Route([pair], tokenIn, tokenOut);

    const trade = new Trade(
      route,
      CurrencyAmount.fromRawAmount(tokenOut, exactAmountOut.toString()),
      TradeType.EXACT_OUTPUT
    );

    const amountIn = BigInt(
      parseUnits(
        trade
          .maximumAmountIn(new Percent(this.slippageTolerance, 10_000))
          .toSignificant(decimalsIn),
        decimalsIn
      )
    );

    const history = await getFeeHistory(this.options.readClient, {
      blockCount: 10,
      rewardPercentiles: [50],
      blockTag: "latest",
    });

    const feePerGas =
      history.baseFeePerGas.find((fee) => BigInt(fee) != 0n) || 1n;
    const medianPriorityFee =
      history.reward?.find((reward) => BigInt(reward[0]) != 0n)?.[0] || 1n;

    const gasFee = SINGLE_HOP_SWAP_GAS_LIMIT * (feePerGas + medianPriorityFee);

    const estimatedAt = Date.now();

    return [
      new UniV2PreswapQuote(
        exactAmountOut,
        amountIn,
        {
          gasFee,
        },
        estimatedAt,
        estimatedAt + this.quoteValidityMs,
        BigInt(this.options.chain.id),
        {
          address: tokenIn.address,
          decimals: decimalsIn,
        },
        {
          address: addressOut,
          decimals: decimalsOut,
        },
        trade
      ),
    ];
  }
}
