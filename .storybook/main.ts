import type { StorybookConfig } from "@storybook/nextjs-vite";
import { fileURLToPath } from "node:url";

const config: StorybookConfig = {
  stories: ["./stories/**/*.stories.tsx"],
  staticDirs: ["./public"],
  framework: "@storybook/nextjs-vite",
  addons: ["@storybook/addon-docs", "@storybook/addon-a11y", "@storybook/addon-vitest"],
  core: { disableTelemetry: true },
  typescript: { reactDocgen: "react-docgen" },
  async viteFinal(config) {
    const { mergeConfig } = await import("vite");
    return mergeConfig(config, {
      resolve: {
        alias: {
          "next-intl/server": fileURLToPath(new URL("./intl-server.mock.ts", import.meta.url)),
          "@/server/brand": fileURLToPath(new URL("./brand.mock.ts", import.meta.url)),
        },
      },
    });
  },
};

export default config;
