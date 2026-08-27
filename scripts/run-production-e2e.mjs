import { spawn } from "node:child_process";

import environmentFixture from "../tests/fixtures/portal/r1-environments.json" with { type: "json" };

const fixtureOrigin = "http://127.0.0.1:4328";
const portalOrigin = "http://127.0.0.1:4317";

function wait(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function childExit(child) {
  return new Promise((resolve, reject) => {
    child.once("error", reject);
    child.once("exit", (code, signal) => resolve({ code, signal }));
  });
}

async function run(command, arguments_, options = {}) {
  const child = spawn(command, arguments_, {
    cwd: process.cwd(),
    env: { ...process.env, ...options.environment },
    stdio: "inherit",
  });
  const result = await childExit(child);
  if (result.code !== 0) {
    throw new Error(`${options.label ?? command} failed with exit code ${String(result.code)}.`);
  }
}

async function waitForFixture() {
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`${fixtureOrigin}/health`, {
        cache: "no-store",
        signal: AbortSignal.timeout(1000),
      });
      if (response.ok) return;
    } catch {
      // The bounded fixture startup window remains open.
    }
    await wait(250);
  }
  throw new Error("Portal R1 build fixture did not become healthy within 30 seconds.");
}

async function stopFixture(child) {
  if (child.exitCode !== null || child.signalCode !== null) return;
  child.kill("SIGTERM");
  const exited = await Promise.race([childExit(child), wait(5000).then(() => null)]);
  if (exited === null && child.exitCode === null && child.signalCode === null) {
    child.kill("SIGKILL");
    await childExit(child);
  }
}

const fixture = spawn(
  process.execPath,
  [
    "--import",
    "tsx",
    "scripts/portal-r1-fixture-server.ts",
    "--environment",
    "preview",
    "--host",
    "127.0.0.1",
    "--port",
    "4328",
  ],
  { cwd: process.cwd(), env: process.env, stdio: "inherit" },
);

try {
  await waitForFixture();
  await run("pnpm", ["build"], {
    label: "fixture-backed production build",
    environment: {
      SITE_URL: portalOrigin,
      SUPABASE_URL: fixtureOrigin,
      SUPABASE_PUBLISHABLE_KEY: environmentFixture.preview.publishableKey,
      PORTAL_SUPABASE_TIMEOUT_MS: "2000",
    },
  });
} finally {
  await stopFixture(fixture);
}

await run("pnpm", ["exec", "playwright", "test"], { label: "production Playwright" });
