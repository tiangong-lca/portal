import { expect, test } from "@playwright/test";

test("renders the anonymous Portal bootstrap shell", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { level: 1 })).toContainText("公开生命周期数据");
  await expect(page.getByText("Phase 0 · Compatibility and governance bootstrap")).toBeVisible();
});
