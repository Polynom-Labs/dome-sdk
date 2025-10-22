import commonjs from "@rollup/plugin-commonjs";
import resolve from "@rollup/plugin-node-resolve";
import typescript from "@rollup/plugin-typescript";
import { defineConfig } from "rollup";

export default defineConfig([
  {
    output: {
      dir: "dist",
      format: "esm",
      sourcemap: true,
    },
    external: ["viem"],
    input: "src/index.ts",
    plugins: [
      typescript({
        declarationDir: "dist/types",
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
        outDir: "dist/react",
        declarationDir: "dist/react/types",
        noEmit: true,
      }),
      commonjs(),
      resolve({
        preferBuiltins: true,
      }),
    ],
  },
]);
