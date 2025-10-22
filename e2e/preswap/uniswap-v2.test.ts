import { GenericContainer, StartedTestContainer, Wait } from "testcontainers";
import {
  createPublicClient,
  createWalletClient,
  erc20Abi,
  http,
  parseUnits,
  PublicClient,
  WalletClient,
} from "viem";
import { sepolia } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";
import { preswap } from "../../src";
import { PreswapRouteResponseItem } from "../../src/preswap/types";

const USDC_ADDRESS = "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238";
const WETH_ADDRESS = "0xfff9976782d46cc05630d1f6ebab18b2324d6b14";

const SWAP_ROUTER_ADDRESS = "0xeE567Fe1712Faf6149d80dA1E6934E354124CfE3";

const RPC_URL = "https://sepolia.infura.io/v3/b64e2a9ce5a44ba5b7683f8994d8a2cd";

describe("UniV2PreswapProvider", () => {
  let container: StartedTestContainer;
  let rpcUrl: string;
  let testUserPrivateKey: `0x${string}`;
  let testUserAddress: `0x${string}`;
  let preswapProvider: preswap.uniswap.v2.UniV2PreswapProvider;
  let readClient: PublicClient;
  let writeClient: WalletClient;

  beforeAll(async () => {
    testUserPrivateKey =
      "0x22b5cd164b25baf41407bcb8f34cb74d178918ccb7e25196200654fbf601e8f0";
    testUserAddress = "0x99A3850bac7e87D21Df355928e7c42792c2CC596";

    const unstartedContainer = await new GenericContainer(
      "ghcr.io/foundry-rs/foundry:latest"
    )
      .withEntrypoint(["anvil"])
      .withCommand([
        "--host",
        "0.0.0.0",
        "--fork-url",
        RPC_URL,
        "--fork-chain-id",
        "11155111",
        "--fork-block-number",
        "9419790",
        "-a",
        "1",
        "--mnemonic",
        "jungle timber report federal virtual demand recall alert camp picnic seat extra",
      ])
      .withWaitStrategy(Wait.forLogMessage("Listening on 0.0.0.0:8545", 1))
      .withExposedPorts(8545);

    container = await unstartedContainer.start();
    rpcUrl = `http://${container.getHost()}:${container.getMappedPort(8545)}`;
    const rpcTransport = http(rpcUrl, {
      timeout: 60000,
    });
    readClient = createPublicClient({
      chain: sepolia,
      transport: rpcTransport,
    });
    writeClient = createWalletClient({
      chain: sepolia,
      transport: rpcTransport,
      account: privateKeyToAccount(testUserPrivateKey),
    });
    preswapProvider = new preswap.uniswap.v2.UniV2PreswapProvider({
      chain: sepolia,
      readClient,
      writeClient,
      swapRouterAddress: SWAP_ROUTER_ADDRESS,
      wethAddress: WETH_ADDRESS as `0x${string}`,
      txConfirmations: 1,
    });
  }, 60000 * 60);

  afterAll(async () => {
    await container.stop();
  });

  it(
    "should be able to estimate the route",
    async () => {
      const route = await preswapProvider.fetchRoutes({
        chainId: BigInt(sepolia.id),
        fromToken: { address: "native", decimals: 18 },
        toToken: { address: USDC_ADDRESS, decimals: 6 },
        exactAmountOut: BigInt(parseUnits("5", 6).toString()),
      });

      expect(route).toBeDefined();
      expect(route.length).toBe(1);
      expect(route[0].amountIn).toBeGreaterThan(0);
      expect(route[0].fee.gasFee).toBeGreaterThan(0);
    },
    60000 * 60
  );

  it(
    "should be able to execute the route",
    async () => {
      const expectedAmountOut = BigInt(parseUnits("5", 6).toString());

      const [route] = await preswapProvider.fetchRoutes({
        chainId: BigInt(sepolia.id),
        fromToken: { address: "native", decimals: 18 },
        toToken: { address: USDC_ADDRESS, decimals: 6 },
        exactAmountOut: expectedAmountOut,
      });

      const prevBalance = await readClient.readContract({
        address: USDC_ADDRESS,
        abi: erc20Abi,
        functionName: "balanceOf",
        args: [testUserAddress],
      });

      expect(prevBalance).toBe(0n);

      await preswapProvider.executeRoute(route as PreswapRouteResponseItem);

      const newBalance = await readClient.readContract({
        address: USDC_ADDRESS,
        abi: erc20Abi,
        functionName: "balanceOf",
        args: [testUserAddress],
      });

      expect(newBalance).toBe(expectedAmountOut);
    },
    60000 * 60
  );
});
