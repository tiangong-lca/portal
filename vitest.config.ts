import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";
import { playwright } from "@vitest/browser-playwright";
import { storybookTest } from "@storybook/addon-vitest/vitest-plugin";

const softwareWebGL =
  Boolean(process.env.CI) || process.env.PORTAL_STORYBOOK_SOFTWARE_WEBGL === "1";

/** Shared by the component test runner and its CI renderer probe. */
export const storybookBrowserLaunchOptions = {
  channel: "chromium",
  // Select Chromium's software OpenGL driver explicitly on GPU-less test hosts.
  args: softwareWebGL ? ["--use-gl=angle", "--use-angle=swiftshader"] : [],
};

export default defineConfig({
  plugins: [storybookTest({ configDir: fileURLToPath(new URL("./.storybook", import.meta.url)) })],
  test: {
    name: "storybook",
    // Software WebGL compilation must not starve other stories' focus/animation assertions.
    fileParallelism: false,
    // Software WebGL shader compilation shares the deadline with the full interaction flow.
    testTimeout: 30000,
    browser: {
      enabled: true,
      headless: true,
      provider: playwright({ launchOptions: storybookBrowserLaunchOptions }),
      instances: [{ browser: "chromium" }],
    },
  },
});
