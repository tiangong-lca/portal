import { expect, test } from "@playwright/test";

const processRef = "11111111-1111-1111-1111-111111111111@01.00.000";

test("keeps anonymous dynamic HTML out of shared caches", async ({ request }) => {
  for (const path of [
    "/en/search?v=1&kind=process&q=electricity",
    `/en/process/${processRef}`,
    `/en/process/${processRef}/lcia`,
  ]) {
    const response = await request.get(path);
    expect(response.ok()).toBe(true);
    expect(response.headers()["cache-control"]).toContain("private");
    expect(response.headers()["cache-control"]).toContain("no-store");
    expect(response.headers()["set-cookie"]).toBeUndefined();
  }
});

test("keeps prerendered HTML public and hashed assets immutable", async ({ page, request }) => {
  const home = await request.get("/en");
  expect(home.ok()).toBe(true);
  expect(home.headers()["cache-control"]).toContain("s-maxage=");
  expect(home.headers()["set-cookie"]).toBeUndefined();

  await page.goto("/en");
  const assetPath = await page.locator('script[src*="/_next/static/"]').first().getAttribute("src");
  expect(assetPath).toBeTruthy();
  const asset = await request.get(assetPath!);
  expect(asset.ok()).toBe(true);
  expect(asset.headers()["cache-control"]).toContain("immutable");
});
