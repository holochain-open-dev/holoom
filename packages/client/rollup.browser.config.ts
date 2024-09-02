import json from "@rollup/plugin-json";
import typescript from "@rollup/plugin-typescript";
import * as fs from "fs";
import cleanup from "rollup-plugin-cleanup";
import { RollupOptions } from "rollup";

const pkg = JSON.parse(fs.readFileSync("./package.json", "utf-8"));
const banner = `/**
 * @module ${pkg.name}
 * @version ${pkg.version}
 * @file ${pkg.description}
 * @license ${pkg.license}
 * @see [Github]{@link ${pkg.homepage}}
*/`;

const config: RollupOptions = {
  input: "src/index.ts",
  output: [
    {
      file: pkg.exports["."].browser,
      format: "es",
      banner,
    },
  ],
  external: [
    ...Object.keys(pkg.dependencies),
    ...Object.keys(pkg.peerDependencies),
  ],
  plugins: [
    typescript({
      tsconfig: "./build.tsconfig.json",
    }),
    cleanup({ comments: "jsdoc" }),
    json(),
  ],
  onwarn: (warning) => {
    throw new Error(warning.message);
  },
};

export default config;
