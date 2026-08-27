import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

const processRef = "11111111-1111-1111-1111-111111111111@01.00.000";
const flowRef = "22222222-2222-2222-2222-222222222222@01.00.000";
const wcagTags = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

async function expectNoHighImpactViolations(page: Page, route: string) {
  const results = await new AxeBuilder({ page }).withTags(wcagTags).analyze();
  const violations = results.violations
    .filter(({ impact }) => impact === "critical" || impact === "serious")
    .map(({ help, helpUrl, id, impact, nodes }) => ({
      help,
      helpUrl,
      id,
      impact,
      targets: nodes.map(({ target }) => target),
    }));

  expect(violations, `${route} WCAG 2.2 AA high-impact violations`).toEqual([]);
}

for (const route of [
  "/en",
  "/en/search?v=1&kind=process&q=electricity",
  `/en/process/${processRef}`,
  `/en/flow/${flowRef}`,
  "/en/compare?v=1",
  "/en/collections",
]) {
  test(`has no serious or critical WCAG violations on ${route}`, async ({ page }) => {
    await page.goto(route);
    await page.waitForLoadState("networkidle");
    await expectNoHighImpactViolations(page, route);
  });
}

test("keeps the dark theme free of serious or critical WCAG violations", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("tiangong.portal.theme.v1", "dark");
  });
  for (const route of ["/en", "/en/search?v=1&kind=process&q=electricity"]) {
    await page.goto(route);
    await page.waitForLoadState("networkidle");
    await expect(page.locator("html")).toHaveClass(/dark/);
    await expectNoHighImpactViolations(page, `dark ${route}`);
  }
});

test("keeps core anonymous discovery readable without JavaScript", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();

  try {
    await page.goto("/en");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Start with data identity");
    await expect(
      page.getByRole("searchbox", { name: "Search public lifecycle data" }),
    ).toBeVisible();
    await expect(page.getByRole("link", { name: "Process catalog" })).toBeVisible();

    await page.goto(`/en/process/${processRef}`);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Electricity, medium voltage");
    await expect(page.getByText("1 kWh", { exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: "Versions" })).toBeVisible();
    expect(await page.locator('script[type="application/ld+json"]').textContent()).toContain(
      '"@type":"Dataset"',
    );
    expect(await context.cookies()).toEqual([]);
  } finally {
    await context.close();
  }
});

test("exposes stable landmarks and controls at three responsive widths", async ({ page }) => {
  for (const viewport of [
    { height: 667, width: 375 },
    { height: 1024, width: 768 },
    { height: 900, width: 1440 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto("/en");
    await expect(page.getByRole("banner")).toBeVisible();
    await expect(page.getByRole("main")).toHaveCount(1);
    await expect(page.getByRole("contentinfo")).toBeVisible();
    await expect(page.getByRole("radiogroup", { name: "Theme" })).toBeVisible();
    await expect(page.getByRole("link", { name: "切换到中文" })).toBeVisible();
    const maximumScrollX = await page.evaluate(() => {
      window.scrollTo(Number.MAX_SAFE_INTEGER, window.scrollY);
      const value = window.scrollX;
      window.scrollTo(0, window.scrollY);
      return value;
    });
    expect(maximumScrollX).toBeLessThanOrEqual(1);
  }
});
