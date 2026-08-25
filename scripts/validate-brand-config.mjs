import { readBrandConfig } from "../src/config/brand.ts";

const config = readBrandConfig(process.env);

process.stdout.write(
  `Portal brand config OK: ${config.version} (${config.lightPrimary}/${config.darkPrimary})\n`,
);
