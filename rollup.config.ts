import commonjs from "@rollup/plugin-commonjs";
import resolve from "@rollup/plugin-node-resolve";
import typescript from "@rollup/plugin-typescript";
import { defineConfig } from "rollup";

export default defineConfig([
  {
    output: {
      dir: "dist/core",
      format: "esm",
      sourcemap: true,
    },
    external: ["viem"],
    input: "src/index.ts",
    plugins: [
      typescript({
        outDir: "dist/core/types",
        exclude: ["src/react/**/*.ts", "src/react/**/*.tsx"],
      }),
      commonjs(),
      resolve({
        preferBuiltins: true,
      }),
    ],
  },
  {
    output: {
      dir: "dist/react",
      format: "esm",
      sourcemap: true,
    },
    external: ["viem", "react", "wagmi", "@dome-protocol/sdk"],
    input: "src/react/index.ts",
    plugins: [
      typescript({
        include: [
          "src/react/**/*.ts",
          "src/react/**/*.tsx",
          "src/preswap/**/*.ts",
        ],
        outDir: "dist/react/types",
      }),
      commonjs(),
      resolve({
        preferBuiltins: true,
      }),
    ],
  },
]);
