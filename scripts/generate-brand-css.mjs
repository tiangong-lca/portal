import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

import nextEnv from "@next/env";

import { readBrandConfig, renderBrandCss } from "../src/config/brand.ts";

const { loadEnvConfig } = nextEnv;

loadEnvConfig(process.cwd());

const outputUrl = new URL("../src/app/brand.generated.css", import.meta.url);
const output = renderBrandCss(readBrandConfig(process.env));
let current = "";

try {
  current = await readFile(outputUrl, "utf8");
} catch (error) {
  if (!(error instanceof Error && "code" in error && error.code === "ENOENT")) {
    throw error;
  }
}

if (current !== output) {
  await writeFile(outputUrl, output, "utf8");
}

process.stdout.write(`Generated ${fileURLToPath(outputUrl)}\n`);
