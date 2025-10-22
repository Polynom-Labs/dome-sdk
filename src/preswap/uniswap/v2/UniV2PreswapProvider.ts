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
  PreswapRoute,
  PreswapRouteRequest,
  PreswapRouteResponseItem,
} from "../../types";
import {
  parseAbi,
  PublicClient,
  WalletClient,
  getContract,
  isAddress,
  erc20Abi,
  parseUnits,
} from "viem";
import { UniV2PreswapQuote } from "./UniV2PreswapQuote";

const POOL_RAW_ABI = parseAbi([
  "function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)",
]);

const SWAP_ROUTER_RAW_ABI = parseAbi([
  "function swapTokensForExactTokens(uint amountOut, uint amountInMax, address[] calldata path, address to,uint deadline) external returns (uint[] memory amounts)",
  "function swapETHForExactTokens(uint amountOut, address[] calldata path, address to, uint deadline) external payable returns (uint[] memory amounts)",
]);

const SINGLE_HOP_SWAP_GAS_LIMIT = 127_000n;

interface UniV2PreswapProviderOptions {
  chainId: number;
  readClient: PublicClient;
  writeClient: WalletClient;
  swapRouterAddress: string;
  quoteValidityMs?: number;
  wethAddress?: string;
  txConfirmations?: number;
  slippageTolerance?: number;
}

export class UniV2PreswapProvider implements PreswapProvider {
  private readonly chainId: number;
  private readonly readClient: PublicClient;
  private readonly writeClient: WalletClient;
  private readonly quoteValidityMs: number;
  private readonly wethAddress: string;
  private readonly swapRouterAddress: string;
  private readonly txConfirmations: number;
  private readonly slippageTolerance: number;

  constructor({
    chainId,
    readClient,
    writeClient,
    quoteValidityMs = 1000 * 60 * 3,
    wethAddress = WETH9[chainId].address,
    swapRouterAddress,
    txConfirmations = 5,
    slippageTolerance = 50,
  }: UniV2PreswapProviderOptions) {
    this.chainId = chainId;
    this.readClient = readClient;
    this.writeClient = writeClient;
    this.quoteValidityMs = quoteValidityMs;
    if (!isAddress(wethAddress)) {
      throw new Error("Invalid WETH address");
    }
    this.wethAddress = wethAddress;
    this.swapRouterAddress = swapRouterAddress;
    this.txConfirmations = txConfirmations;
    this.slippageTolerance = slippageTolerance;
  }

  getSupportedChainIds(): Array<bigint> {
    return [BigInt(this.chainId)];
  }

  async executeRoute(route: PreswapRouteResponseItem): Promise<void> {
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
    const recipient = this.writeClient.account!.address;
    const path = [
      fromToken.address as `0x${string}`,
      toToken.address as `0x${string}`,
    ];

    if (isTokenInIsWeth) {
      const tx = await this.writeClient.writeContract({
        address: this.swapRouterAddress as `0x${string}`,
        abi: SWAP_ROUTER_RAW_ABI,
        functionName: "swapETHForExactTokens",
        args: [
          exactAmountOut,
          path,
          recipient,
          BigInt(Math.floor(Date.now() / 1000) + 1800),
        ],
        chain: this.writeClient.chain,
        account: this.writeClient.account!,
        value: amountIn,
      });
      await this.readClient.waitForTransactionReceipt({
        hash: tx,
        confirmations: this.txConfirmations,
      });
    } else {
      const allowance = await this.readClient.readContract({
        address: fromToken.address as `0x${string}`,
        abi: erc20Abi,
        functionName: "allowance",
        args: [
          this.writeClient.account!.address as `0x${string}`,
          this.swapRouterAddress as `0x${string}`,
        ],
      });

      if (amountIn > allowance) {
        const tx = await this.writeClient.writeContract({
          address: fromToken.address as `0x${string}`,
          abi: erc20Abi,
          functionName: "approve",
          args: [this.swapRouterAddress as `0x${string}`, amountIn],
          chain: this.writeClient.chain,
          account: this.writeClient.account!,
        });
        await this.readClient.waitForTransactionReceipt({
          hash: tx,
          confirmations: this.txConfirmations,
        });
      }
      const tx = await this.writeClient.writeContract({
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
        chain: this.writeClient.chain,
        account: this.writeClient.account!,
      });
      await this.readClient.waitForTransactionReceipt({
        hash: tx,
        confirmations: this.txConfirmations,
      });
    }
  }

  private async createPair(tokenIn: Token, tokenOut: Token): Promise<Pair> {
    const pairAddress = Pair.getAddress(tokenIn, tokenOut) as `0x${string}`;

    const pairContract = getContract({
      address: pairAddress,
      abi: POOL_RAW_ABI,
      client: this.readClient,
    });

    const reserves = await pairContract.read.getReserves();
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

  async fetchRoutes({
    exactAmountOut,
    fromToken: { address: addressIn, decimals: decimalsIn },
    toToken: { address: addressOut, decimals: decimalsOut },
  }: PreswapRouteRequest): Promise<Array<PreswapRoute>> {
    const tokenIn = new Token(
      this.chainId,
      addressIn === "native" ? this.wethAddress : addressIn,
      decimalsIn
    );
    const tokenOut = new Token(this.chainId, addressOut, decimalsOut);

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

    const history = await this.readClient.getFeeHistory({
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
        BigInt(this.chainId),
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
