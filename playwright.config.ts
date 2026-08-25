import { defineConfig, devices } from "@playwright/test";

const portalE2eUrl = "http://127.0.0.1:4317";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: portalE2eUrl,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "pnpm start --hostname 127.0.0.1 --port 4317",
    url: portalE2eUrl,
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
