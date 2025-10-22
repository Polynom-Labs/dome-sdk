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
]);
