import { expect, test } from "@playwright/test";
import { createHash } from "node:crypto";

const processId = "11111111-1111-1111-1111-111111111111";
const processRef = `${processId}@01.00.000`;
const flowId = "22222222-2222-2222-2222-222222222222";
const flowRef = `${flowId}@01.00.000`;

test("serves localized anonymous discovery with persistent theme and SEO alternates", async ({
  context,
  page,
}) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/zh-CN$/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("从数据身份出发");
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", /\/zh-CN$/);
  await expect(page.locator('link[rel="alternate"][hreflang="en"]')).toHaveAttribute(
    "href",
    /\/en$/,
  );
  const themeScript = await page.request.get("/brand/theme-init.js");
  const expectedIntegrity = `sha256-${createHash("sha256")
    .update(await themeScript.body())
    .digest("base64")}`;
  await expect(page.locator('script[src="/brand/theme-init.js"]')).toHaveAttribute(
    "integrity",
    expectedIntegrity,
  );

  await page.getByRole("radio", { name: "深色" }).click();
  await expect(page.locator("html")).toHaveClass(/dark/);
  await expect(page.locator("[data-brand-dark-logo]").first()).toBeVisible();
  await expect(page.locator("[data-brand-light-logo]").first()).toBeHidden();
  await page.reload();
  await expect(page.locator("html")).toHaveClass(/dark/);

  await page.getByRole("link", { name: "Switch to English" }).click();
  await expect(page).toHaveURL(/\/en$/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Start with data identity");
  await expect(page.locator('[lang="en"]')).toBeVisible();
  expect(await context.cookies()).toEqual([]);
});

test("renders public search, exact details, numeric context, versions, and latest redirects", async ({
  page,
  request,
}) => {
  await page.goto("/en/search?v=1&kind=process&q=electricity");
  await expect(page.getByRole("heading", { name: "Search the public catalog" })).toBeVisible();
  await expect(page.getByText("Electricity, medium voltage", { exact: true })).toBeVisible();
  await expect(page.getByText(processRef, { exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Next" })).toHaveAttribute(
    "href",
    /cursor=eyJ2IjoxfQ/,
  );

  await page.goto(`/en/process/${processRef}`);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Electricity, medium voltage");
  await expect(page.getByText("1 kWh", { exact: true })).toBeVisible();
  expect(await page.locator('script[type="application/ld+json"]').textContent()).toContain(
    '"@type":"Dataset"',
  );

  await page.goto(`/en/process/${processRef}/exchanges`);
  await expect(page.getByRole("cell", { name: "1.25 kg" })).toBeVisible();
  await expect(page.getByRole("cell", { name: "1 kWh" })).toBeVisible();
  await expect(page.getByRole("cell", { name: "portal-capability-policy.v1" })).toBeVisible();

  await page.goto(`/en/process/${processRef}/lcia`);
  await expect(page.getByRole("cell", { name: "12.5" })).toBeVisible();
  await expect(page.getByRole("cell", { name: "kg CO2-Eq" })).toBeVisible();
  await expect(page.getByText("55555555-5555-5555-5555-555555555555@release-2026.1")).toBeVisible();

  await page.goto(`/en/process/${processRef}/versions`);
  await expect(page.getByText(processRef, { exact: true }).first()).toBeVisible();

  await page.goto(`/en/flow/${flowRef}`);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Carbon dioxide");

  const flowVersions = await request.get(`/en/flow/${flowRef}/versions`);
  expect(flowVersions.ok()).toBe(true);
  expect(await flowVersions.text()).toContain(flowRef);
  await page.goto(`/en/flow/${flowRef}/versions`);
  await expect(page.getByRole("heading", { name: "Version history" })).toBeVisible();
  await expect(page.getByText(flowRef, { exact: true }).first()).toBeVisible();

  const latest = await request.get(`/en/process/${processId}`, { maxRedirects: 0 });
  expect(latest.status()).toBe(307);
  expect(latest.headers().location).toContain(`/en/process/${processRef}`);

  const latestFlow = await request.get(`/en/flow/${flowId}`, { maxRedirects: 0 });
  expect(latestFlow.status()).toBe(307);
  expect(latestFlow.headers().location).toContain(`/en/flow/${flowRef}`);

  const missing = await request.get("/en/process/99999999-9999-9999-9999-999999999999@01.00.000");
  expect(missing.status()).toBe(404);
  const missingFlow = await request.get("/en/flow/99999999-9999-9999-9999-999999999999@01.00.000");
  expect(missingFlow.status()).toBe(404);
});

test("completes the HTML-first search to two-member comparison path", async ({ page }) => {
  await page.goto("/en/search?v=1&kind=process&q=electricity&sort=relevance");
  const candidates = page.getByRole("checkbox", { name: "Select this Process" });
  await expect(candidates).toHaveCount(2);
  await candidates.nth(0).check();
  await candidates.nth(1).check();

  const processFacet = page.getByRole("link", { name: /Process \(\d+\)/ });
  await expect(processFacet).toHaveAttribute("href", /q=electricity/);
  await expect(processFacet).toHaveAttribute("href", /kind=process/);
  await expect(processFacet).toHaveAttribute("href", /sort=relevance/);
  await expect(processFacet).not.toHaveAttribute("href", /cursor=/);

  await page.getByRole("button", { name: "Compare selected Processes" }).click();
  await expect(page).toHaveURL(/\/en\/compare\?/);
  await expect(page.getByRole("heading", { name: "Deterministic comparison" })).toBeVisible();
  await expect(
    page.getByRole("columnheader", { name: "Electricity, medium voltage" }),
  ).toBeVisible();
  await expect(page.getByRole("columnheader", { name: "Electricity, low voltage" })).toBeVisible();

  await page.getByLabel("Impact category").fill("climate-change");
  await page.getByLabel("Impact category").press("Enter");
  await expect(page.getByRole("heading", { name: "Comparable LCIA values" })).toBeVisible();
  await expect(page.getByRole("cell", { name: "12.5" })).toBeVisible();
  await expect(page.getByRole("cell", { name: "9.75" })).toBeVisible();
  await expect(page.getByText(/55555555-5555-5555-5555-555555555555@release-2026.1/)).toBeVisible();
});

test("renders Browse in initial HTML and keeps private work surfaces out of the index", async ({
  page,
  request,
}) => {
  const browse = await request.get("/en/browse/process");
  expect(await browse.text()).toContain("Electricity, medium voltage");

  for (const path of ["/en/search?v=1&q=electricity", "/en/compare", "/en/collections"]) {
    await page.goto(path);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  }

  const sitemap = await request.get("/sitemap.xml");
  const sitemapBody = await sitemap.text();
  expect(sitemap.ok()).toBe(true);
  expect(sitemapBody).toContain("hreflang");

  const processSitemapIndex = await request.get("/catalog/process/sitemap.xml");
  expect(processSitemapIndex.ok()).toBe(true);
  expect(processSitemapIndex.headers()["cache-control"]).toContain("s-maxage=300");
  expect(await processSitemapIndex.text()).toContain("/catalog/process/sitemap/0.xml");
  const processSitemapShard = await request.get("/catalog/process/sitemap/0.xml");
  expect(processSitemapShard.ok()).toBe(true);
  const processSitemapBody = await processSitemapShard.text();
  expect(processSitemapBody).toContain(processRef);
  expect(processSitemapBody).toContain('hreflang="en"');
  expect((await request.get("/catalog/process/sitemap/not-a-shard.xml")).status()).toBe(404);
});

test("keeps the local collection local and shares member IDs only", async ({ context, page }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/en/collections");
  await page.getByLabel("Exact member ID").fill(processRef);
  await page.getByRole("button", { name: "Add to collection" }).click();
  await page.getByLabel("Local note / rationale").fill("private local note");
  await page.reload();
  await expect(page.getByText(processRef, { exact: true })).toBeVisible();
  await expect(page.getByLabel("Local note / rationale")).toHaveValue("private local note");

  await page.getByRole("button", { name: "Copy ID-only share link" }).click();
  const shared = await page.evaluate(() => navigator.clipboard.readText());
  expect(shared).toContain("#collection=");
  expect(shared).not.toContain("private local note");
  expect(await context.cookies()).toEqual([]);
});

test("quarantines corrupt local collection data until the user explicitly clears it", async ({
  page,
}) => {
  await page.addInitScript(() => {
    localStorage.setItem("tiangong.portal.collections.v1", "{corrupt-json");
  });
  await page.goto("/en/collections");
  await expect(page.getByRole("button", { name: "Download corrupt raw data" })).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem("tiangong.portal.collections.v1"))).toBe(
    "{corrupt-json",
  );
  await page.getByRole("button", { name: "Clear corrupt data" }).click();
  await expect(page.getByRole("button", { name: "Download corrupt raw data" })).toBeHidden();
});

test("keeps core controls available at mobile width and 200 percent text zoom", async ({
  page,
}) => {
  await page.setViewportSize({ height: 667, width: 375 });
  await page.goto("/en");
  await page.evaluate(() => {
    document.documentElement.style.fontSize = "200%";
  });
  await expect(page.getByRole("searchbox", { name: "Search public lifecycle data" })).toBeVisible();
  const layout = await page.evaluate(async () => {
    const root = document.documentElement;
    const initialClientWidth = root.clientWidth;
    const initialInnerWidth = window.innerWidth;
    const initialScrollWidth = root.scrollWidth;
    const viewportRight = Math.max(root.clientWidth, window.innerWidth);
    const offenders = Array.from(document.body.querySelectorAll<HTMLElement>("*"))
      .map((element) => {
        const rect = element.getBoundingClientRect();
        const style = window.getComputedStyle(element);

        return {
          className: element.className.toString().slice(0, 160),
          clientWidth: element.clientWidth,
          fontFamily: style.fontFamily,
          left: Math.round(rect.left * 10) / 10,
          overflowWrap: style.overflowWrap,
          right: Math.round(rect.right * 10) / 10,
          scrollWidth: element.scrollWidth,
          tagName: element.tagName.toLowerCase(),
          text: element.textContent?.trim().replace(/\s+/g, " ").slice(0, 120) ?? "",
          width: Math.round(rect.width * 10) / 10,
          wordBreak: style.wordBreak,
        };
      })
      .filter(({ left, right }) => left < -1 || right > viewportRight + 1)
      .sort((left, right) => right.right - viewportRight - (left.right - viewportRight))
      .slice(0, 12);

    const previousY = window.scrollY;
    window.scrollTo(Number.MAX_SAFE_INTEGER, previousY);
    const immediateScrollX = window.scrollX;
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
    });
    window.scrollTo(Number.MAX_SAFE_INTEGER, previousY);
    const settledScrollX = window.scrollX;
    const maximumScrollX = Math.max(immediateScrollX, settledScrollX);
    window.scrollTo(0, previousY);

    return {
      bodyScrollWidth: document.body.scrollWidth,
      clientWidth: root.clientWidth,
      fontStatus: document.fonts.status,
      initialClientWidth,
      initialInnerWidth,
      initialOverflow: initialScrollWidth - initialClientWidth,
      initialScrollWidth,
      immediateScrollX,
      innerWidth: window.innerWidth,
      maximumScrollX,
      offenders,
      settledScrollX,
      settledOverflow: root.scrollWidth - root.clientWidth,
      scrollWidth: root.scrollWidth,
    };
  });
  expect(
    layout.maximumScrollX,
    `Zoomed viewport layout: ${JSON.stringify(layout)}`,
  ).toBeLessThanOrEqual(1);

  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Skip to main content" })).toBeFocused();
});
