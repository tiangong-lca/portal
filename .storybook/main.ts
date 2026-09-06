import type { StorybookConfig } from "@storybook/nextjs-vite";

const config: StorybookConfig = {
  stories: ["./stories/**/*.stories.tsx"],
  staticDirs: ["./public"],
  framework: "@storybook/nextjs-vite",
  addons: ["@storybook/addon-docs", "@storybook/addon-a11y", "@storybook/addon-vitest"],
  core: { disableTelemetry: true },
  typescript: { reactDocgen: "react-docgen" },
};

export default config;
