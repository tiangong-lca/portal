import { expect, test } from "@playwright/test";

const processRef = "11111111-1111-1111-1111-111111111111@01.00.000";

function parseCacheControl(value: string | undefined): Map<string, string | true> {
  expect(value, "Cache-Control header").toBeTruthy();

  const entries: Array<readonly [string, string | true]> = value!
    .split(",")
    .map((directive) => directive.trim())
    .filter(Boolean)
    .map((directive) => {
      const separator = directive.indexOf("=");
      if (separator === -1) return [directive.toLowerCase(), true] as const;

      return [
        directive.slice(0, separator).trim().toLowerCase(),
        directive
          .slice(separator + 1)
          .trim()
          .replace(/^"|"$/g, ""),
      ] as const;
    });

  return new Map(entries);
}

function numericDirective(directives: Map<string, string | true>, name: string): number {
  const value = directives.get(name);
  expect(typeof value, `${name} cache directive`).toBe("string");
  const parsed = Number(value);
  expect(Number.isFinite(parsed), `${name} cache directive`).toBe(true);
  return parsed;
}

test("keeps anonymous dynamic HTML out of shared caches", async ({ request }) => {
  for (const path of [
    "/en/search?v=1&kind=process&q=electricity",
    `/en/process/${processRef}`,
    `/en/process/${processRef}/lcia`,
  ]) {
    const response = await request.get(path);
    expect(response.ok()).toBe(true);
    const cacheControl = parseCacheControl(response.headers()["cache-control"]);
    expect(cacheControl.get("private")).toBe(true);
    expect(cacheControl.get("no-store")).toBe(true);
    expect(cacheControl.has("public")).toBe(false);
    expect(cacheControl.has("immutable")).toBe(false);
    expect(cacheControl.has("s-maxage")).toBe(false);
    expect(response.headers()["set-cookie"]).toBeUndefined();
  }
});

test("keeps prerendered HTML public and hashed assets immutable", async ({ page, request }) => {
  const home = await request.get("/en");
  expect(home.ok()).toBe(true);
  const homeCacheControl = parseCacheControl(home.headers()["cache-control"]);
  expect(numericDirective(homeCacheControl, "s-maxage")).toBeGreaterThan(0);
  expect(homeCacheControl.has("private")).toBe(false);
  expect(homeCacheControl.has("no-store")).toBe(false);
  expect(home.headers()["set-cookie"]).toBeUndefined();

  await page.goto("/en");
  const assetPath = await page.locator('script[src*="/_next/static/"]').first().getAttribute("src");
  expect(assetPath).toBeTruthy();
  const asset = await request.get(assetPath!);
  expect(asset.ok()).toBe(true);
  const assetCacheControl = parseCacheControl(asset.headers()["cache-control"]);
  expect(assetCacheControl.get("public")).toBe(true);
  expect(assetCacheControl.get("immutable")).toBe(true);
  expect(numericDirective(assetCacheControl, "max-age")).toBeGreaterThan(0);
  expect(assetCacheControl.has("private")).toBe(false);
  expect(assetCacheControl.has("no-store")).toBe(false);
});
