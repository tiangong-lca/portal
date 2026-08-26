import { expect, test } from "@playwright/test";

const processId = "11111111-1111-1111-1111-111111111111";
const processRef = `${processId}@01.00.000`;
const flowRef = "22222222-2222-2222-2222-222222222222@01.00.000";

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

  const latest = await request.get(`/en/process/${processId}`, { maxRedirects: 0 });
  expect(latest.status()).toBe(307);
  expect(latest.headers().location).toContain(`/en/process/${processRef}`);

  const missing = await request.get("/en/process/99999999-9999-9999-9999-999999999999@01.00.000");
  expect(missing.status()).toBe(404);
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
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(1);

  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Skip to main content" })).toBeFocused();
});
