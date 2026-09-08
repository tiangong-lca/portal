import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";
import { playwright } from "@vitest/browser-playwright";
import { storybookTest } from "@storybook/addon-vitest/vitest-plugin";

export default defineConfig({
  plugins: [storybookTest({ configDir: fileURLToPath(new URL("./.storybook", import.meta.url)) })],
  test: {
    name: "storybook",
    // Software WebGL compilation must not starve other stories' focus/animation assertions.
    fileParallelism: false,
    browser: {
      enabled: true,
      headless: true,
      provider: playwright(),
      instances: [{ browser: "chromium" }],
    },
  },
});
