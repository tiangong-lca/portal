import { defineConfig, devices } from "@playwright/test";

import environmentFixture from "./tests/fixtures/portal/r1-environments.json" with { type: "json" };

const portalE2eUrl = "http://127.0.0.1:4317";
const portalFixtureUrl = "http://127.0.0.1:4328";
const previewFixture = environmentFixture.preview;

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
  webServer: [
    {
      name: "Portal R1 fixture",
      command: "pnpm fixture:r1 --environment preview --host 127.0.0.1 --port 4328",
      url: `${portalFixtureUrl}/health`,
      reuseExistingServer: false,
      timeout: 30_000,
      gracefulShutdown: { signal: "SIGTERM", timeout: 5000 },
    },
    {
      name: "Portal",
      command: "pnpm start --hostname 127.0.0.1 --port 4317",
      url: portalE2eUrl,
      reuseExistingServer: false,
      timeout: 120_000,
      gracefulShutdown: { signal: "SIGTERM", timeout: 5000 },
      env: {
        SITE_URL: portalE2eUrl,
        PORTAL_SITEMAP_CACHE_MODE: "shared-300",
        SUPABASE_URL: portalFixtureUrl,
        SUPABASE_PUBLISHABLE_KEY: previewFixture.publishableKey,
        PORTAL_SUPABASE_TIMEOUT_MS: "2000",
        PORTAL_EDGE_ENDPOINT: portalFixtureUrl,
        PORTAL_EDGE_KEY_ID: previewFixture.keyId,
        PORTAL_EDGE_HMAC_SECRET: previewFixture.hmacSecret,
        PORTAL_EDGE_TIMEOUT_MS: "2000",
      },
    },
  ],
});
