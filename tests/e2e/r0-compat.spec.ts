import { expect, test } from "@playwright/test";

const strictCspExpected = process.env.PORTAL_EXPECT_STRICT_CSP === "1";
const portalOrigin = `http://127.0.0.1:${process.env.PORTAL_E2E_PORT ?? "4317"}`;

test("serves the R0 matrix through native routing with the strict CSP candidate", async ({
  page,
}) => {
  const cspErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error" && message.text().toLowerCase().includes("content security")) {
      cspErrors.push(message.text());
    }
  });

  const response = await page.goto("/r0-compat");

  expect(response).not.toBeNull();
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  expect(response!.headers()["x-portal-routing"]).toBe("edgeone-native-v1");
  expect(response!.headers()["x-robots-tag"]).toContain("noindex");

  const cspHeaderName = strictCspExpected
    ? "content-security-policy"
    : "content-security-policy-report-only";
  const csp = response!.headers()[cspHeaderName];
  expect(csp).toContain("script-src 'self'");
  expect(csp).not.toContain("'unsafe-inline'");
  expect(csp).not.toContain("'unsafe-eval'");

  await expect(page.getByRole("heading", { name: "R0 compatibility matrix" })).toBeVisible();
  await expect
    .poll(async () =>
      (
        await page
          .locator('script[src*="/_next/"]')
          .evaluateAll((scripts) => scripts.map((script) => script.getAttribute("integrity")))
      ).some((value) => value?.startsWith("sha256-")),
    )
    .toBe(true);
  if (strictCspExpected) {
    expect(cspErrors).toEqual([]);
  }
});

test("reports the deployed SSR runtime without exposing secrets", async ({ page }) => {
  const response = await page.goto("/r0-compat/ssr");

  await expect(page.locator("[data-r0-runtime-version]")).toHaveText(/^v\d+\./);
  expect(response!.headers()["cache-control"]).toContain("private");
  expect(await page.textContent("body")).not.toContain("PORTAL_EDGE_HMAC_SECRET");
});

test("keeps the ISR route cacheable with a sixty-second revalidation window", async ({
  request,
}) => {
  const first = await request.get("/r0-compat/isr");
  const second = await request.get("/r0-compat/isr");

  expect(first.ok()).toBe(true);
  expect(first.headers()["cache-control"]).toContain("s-maxage=60");
  expect(await second.text()).toBe(await first.text());
});

test("streams deferred evidence and exposes the route-handler contract", async ({
  page,
  request,
}) => {
  await page.goto("/r0-compat/streaming");
  await expect(page.locator("[data-r0-stream-complete]")).toBeVisible();

  const response = await request.get("/r0-compat/route-handler");
  expect(response.ok()).toBe(true);
  expect(response.headers()["cache-control"]).toContain("no-store");
  expect(await response.json()).toMatchObject({
    schemaVersion: "portal.r0-route-handler.v1",
    deploymentEnvironment: "local",
  });
});

test("uses Next image optimization and a noindex robots policy", async ({ page, request }) => {
  await page.goto("/r0-compat/image");
  await expect(page.locator("[data-r0-optimized-image]")).toHaveAttribute("src", /_next\/image/);

  const robots = await request.get("/robots.txt");
  expect(await robots.text()).toContain("Disallow: /");
});

test("restores a local dark preference through the external bootstrap script", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("tiangong.portal.theme.v1", "dark"));
  await page.goto("/");

  await expect(page.locator("html")).toHaveClass(/dark/);
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
});

test("keeps the fixed-target HMAC BFF disabled without complete fixture secrets", async ({
  request,
}) => {
  const response = await request.post("/r0-compat/hmac", {
    data: { probe: true },
  });

  expect(response.status()).toBe(503);
  expect(await response.json()).toEqual({ code: "r0_hmac_fixture_disabled" });
});

test("preserves state while canonicalizing bounded unlocalized paths", async ({ request }) => {
  const cases = [
    ["/search?v=1&kind=process&q=steel%20coil", "/zh-CN/search?v=1&kind=process&q=steel%20coil"],
    ["/compare?v=1&m=a&m=b", "/zh-CN/compare?v=1&m=a&m=b"],
    ["/collections?source=local", "/zh-CN/collections?source=local"],
    ["/methodology?section=license", "/zh-CN/methodology?section=license"],
    ["/browse/process?page=2", "/zh-CN/browse/process?page=2"],
    ["/process/example@01.00.000?tab=quality", "/zh-CN/process/example@01.00.000?tab=quality"],
    ["/flow/example@01.00.000?tab=versions", "/zh-CN/flow/example@01.00.000?tab=versions"],
  ] as const;

  for (const [source, destination] of cases) {
    const response = await request.get(source, { maxRedirects: 0 });
    expect(response.status()).toBe(307);
    const location = response.headers().location;
    expect(location).toMatch(/^\//u);
    const actual = new URL(location!, portalOrigin);
    const expected = new URL(destination, portalOrigin);
    expect(actual.pathname).toBe(expected.pathname);
    expect([...actual.searchParams]).toEqual([...expected.searchParams]);
    expect(response.headers()["cache-control"]).toContain("no-store");
  }
});

test("returns the product not-found surface for unknown paths", async ({ page, request }) => {
  const rawResponse = await request.get("/does-not-exist-r0");
  const rawHtml = await rawResponse.text();

  expect(rawResponse.status()).toBe(404);
  expect(rawHtml).toContain('<html data-brand-version="default-v1" lang="zh-CN"');
  expect(rawHtml).not.toContain('id="__next_error__"');

  const response = await page.goto("/does-not-exist-r0");

  expect(response!.status()).toBe(404);
  await expect(page).toHaveURL(/\/does-not-exist-r0$/);
  await expect(page.locator("html")).toHaveAttribute("lang", "zh-CN");
  await expect(page.getByRole("heading", { name: "页面不存在" })).toBeVisible();

  const globalResponse = await page.goto("/internal/does-not-exist-r0");

  expect(globalResponse!.status()).toBe(404);
  await expect(page.locator("html")).toHaveAttribute("lang", "zh-CN");
  await expect(page.getByRole("heading", { name: "页面不存在" })).toBeVisible();
});
