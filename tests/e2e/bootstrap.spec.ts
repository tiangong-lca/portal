import { expect, test } from "@playwright/test";

test("renders the anonymous Portal bootstrap shell", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveURL(/\/zh-CN$/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("找到适合问题");
  await expect(page.getByRole("contentinfo").getByText("开放数据 · 只读 · 无需账号")).toBeVisible();
  await expect(page.getByRole("searchbox", { name: "搜索公开生命周期数据" })).toBeEnabled();
  await expect(page.locator("[data-brand-light-logo]").first()).toBeVisible();

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

test("uses the configured compact mark at mobile width", async ({ page }) => {
  await page.setViewportSize({ height: 667, width: 375 });
  await page.goto("/");
  await expect(page.locator("[data-brand-logo-mark]").first()).toBeVisible();
  await expect(page.locator("[data-brand-light-logo]").first()).toBeHidden();
});

test("uses the current theme logo as the default mobile mark", async ({ page }) => {
  await page.setViewportSize({ height: 667, width: 375 });
  await page.addInitScript(() => {
    localStorage.setItem("tiangong.portal.theme.v1", "dark");
  });
  await page.goto("/");

  await expect(page.locator("html")).toHaveClass(/dark/);
  await expect(page.locator('[data-brand-logo-mark-theme="light"]').first()).toBeHidden();
  const darkMark = page.locator('[data-brand-logo-mark-theme="dark"]').first();
  await expect(darkMark).toBeVisible();
  await expect(darkMark).toHaveAttribute("src", "/brand/logo-dark.svg");
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
  await expect(page.locator("[data-brand-logo] img").first()).toHaveJSProperty("naturalWidth", 0);
  await expect(page.locator("[data-brand-logo-fallback-layer]")).toHaveText("TG");
});
