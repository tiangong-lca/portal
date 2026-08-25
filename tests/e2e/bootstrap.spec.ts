import { expect, test } from "@playwright/test";

test("renders the anonymous Portal bootstrap shell", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { level: 1 })).toContainText("公开生命周期数据");
  await expect(page.getByText("Phase 0 · Compatibility and governance bootstrap")).toBeVisible();
  await expect(page.getByRole("searchbox", { name: "搜索公开生命周期数据" })).toBeDisabled();
  await expect(page.locator("[data-brand-logo] img")).toBeVisible();

  await expect
    .poll(() =>
      page.evaluate(() =>
        getComputedStyle(document.documentElement)
          .getPropertyValue("--brand-light-primary")
          .trim()
          .toLowerCase(),
      ),
    )
    .toBe("#5c246a");
});

test("falls back to a text mark when configured and default logos fail", async ({ page }) => {
  let failedLogoRequests = 0;

  await page.route("**/*", (route) => {
    const pathname = new URL(route.request().url()).pathname;

    if (pathname === "/brand/logo.svg" || pathname === "/brand/logo-dark.svg") {
      failedLogoRequests += 1;
      return route.fulfill({ body: "", status: 404 });
    }

    return route.continue();
  });
  await page.goto("/");

  await expect.poll(() => failedLogoRequests).toBeGreaterThan(0);
  await expect(page.locator("[data-brand-logo] img")).toHaveJSProperty("naturalWidth", 0);
  await expect(page.locator("[data-brand-logo-fallback-layer]")).toHaveText("TG");
});
