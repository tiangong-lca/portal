import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import en from "../../src/i18n/messages/en.json" with { type: "json" };
import zh from "../../src/i18n/messages/zh-CN.json" with { type: "json" };
import de from "../../src/i18n/messages/de.json" with { type: "json" };
import fr from "../../src/i18n/messages/fr.json" with { type: "json" };

const messages = { en, "zh-CN": zh, de, fr };
const processRef = "11111111-1111-1111-1111-111111111111@01.00.000";
const secondRef = "77777777-7777-7777-7777-777777777777@01.00.000";
const flowRef = "22222222-2222-2222-2222-222222222222@01.00.000";
async function noOverflow(page: Page) {
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    ),
  ).toBeLessThanOrEqual(1);
}
async function accessible(page: Page) {
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
        .analyze()
    ).violations,
  ).toEqual([]);
}

for (const { locale, width, theme } of [
  { locale: "fr", width: 320, theme: "light" },
  { locale: "fr", width: 320, theme: "dark" },
  { locale: "zh-CN", width: 390, theme: "light" },
  { locale: "en", width: 390, theme: "dark" },
  { locale: "de", width: 768, theme: "light" },
  { locale: "de", width: 1024, theme: "light" },
  { locale: "en", width: 1440, theme: "light" },
  { locale: "zh-CN", width: 1440, theme: "dark" },
] as const) {
  test(`visual regression ${locale} ${width}px ${theme}`, async ({ page }, info) => {
    await page.setViewportSize({ width, height: 900 });
    await page.addInitScript(
      (value) => localStorage.setItem("tiangong.portal.theme.v1", value),
      theme,
    );
    const t = messages[locale];
    for (const route of ["", "/search?geo=cn", `/flow/${flowRef}`, "/collections"]) {
      await page.goto(`/${locale}${route}`, { waitUntil: "networkidle" });
      await noOverflow(page);
      await accessible(page);
      await page.screenshot({
        path: info.outputPath(`${route ? route.split("/")[1]!.split("?")[0] : "home"}.png`),
        fullPage: true,
      });
    }
    const input = page.getByRole("textbox", { name: t.Collections.memberRef });
    const add = page.getByRole("button", { name: t.Collections.add, exact: true });
    if (width >= 640) {
      const box = await input.boundingBox();
      const button = await add.boundingBox();
      expect(
        Math.abs(box!.y + box!.height / 2 - button!.y - button!.height / 2),
      ).toBeLessThanOrEqual(1);
      expect(Math.abs(box!.height - button!.height)).toBeLessThanOrEqual(1);
    }
    await input.fill(processRef);
    await add.click();
    await page.getByLabel(t.Collections.note).fill("Local review note");
    await expect(page.getByRole("link", { name: /Electricity|电力/ }).first()).toBeVisible();
    await page.getByRole("button", { name: t.Collections.shareWithNotes }).click();
    await expect(page.getByRole("region", { name: t.Collections.sharePreview })).toContainText(
      "Local review note",
    );
    await noOverflow(page);
    await accessible(page);
    await page.screenshot({ path: info.outputPath("shortlist-share.png"), fullPage: true });
  });
}

test("mobile filters layer above the sticky header, close on selection and preserve filters", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/en/search?geo=cn&q=electricity");
  await page.getByRole("button", { name: en.Search.facets }).click();
  const drawer = page.getByRole("dialog");
  await expect(drawer).toBeVisible();
  await drawer.evaluate(async (element) => {
    await Promise.all(
      element
        .getAnimations({ subtree: true })
        .map((animation) => animation.finished.catch(() => undefined)),
    );
  });
  await accessible(page);
  await noOverflow(page);
  await drawer.getByRole("link", { name: "Process (1)" }).click();
  await expect(drawer).toBeHidden();
  await expect(page).toHaveURL(/geo=cn/);
  await expect(page).toHaveURL(/q=electricity/);
  await page.getByRole("radio", { name: en.Search.descriptionMode }).click();
  await expect(page.getByRole("region", { name: en.Hybrid.activeFilters })).toContainText(
    "China (CN)",
  );
  const form = page.getByRole("textbox", { name: en.Hybrid.queryLabel });
  expect((await form.boundingBox())!.y).toBeLessThan(844);
});

test("selection survives detail navigation and comparison names stay visible on mobile", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/en/search?q=electricity");
  await page.getByRole("checkbox", { name: new RegExp(processRef) }).check();
  await page.getByRole("link", { name: "Electricity, low voltage", exact: true }).click();
  await page.getByRole("button", { name: en.Detail.compare, exact: true }).click();
  await page.getByRole("link", { name: en.Compare.openComparison, exact: true }).click();
  await expect(page).toHaveURL(new RegExp(encodeURIComponent(processRef)));
  await expect(page).toHaveURL(new RegExp(encodeURIComponent(secondRef)));
  await expect(
    page
      .getByRole("main")
      .getByRole("link", { name: "Electricity, medium voltage", exact: true })
      .first(),
  ).toBeVisible();
  await expect(
    page
      .getByRole("main")
      .getByRole("link", { name: "Electricity, low voltage", exact: true })
      .first(),
  ).toBeVisible();
  await noOverflow(page);
  await accessible(page);
});

test("sticky header receives pointer hits and citation anchors are not covered", async ({
  page,
}) => {
  await page.goto("/en/search?q=electricity");
  await page.evaluate(() => window.scrollTo(0, 260));
  const nav = page.getByRole("banner").getByRole("link", { name: en.Common.browse, exact: true });
  expect(
    await nav.evaluate((element) => {
      const box = element.getBoundingClientRect();
      const hit = document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2);
      return Boolean(hit && element.contains(hit));
    }),
  ).toBe(true);
  await nav.click();
  await expect(page).toHaveURL(/\/browse\/process$/);
  await page.goto(`/en/process/${processRef}#citation`);
  const citation = page.locator("details#citation");
  await expect(citation).toHaveAttribute("open");
  await expect(citation.getByRole("button", { name: en.Detail.copyCitation })).toBeVisible();
  const headerBox = await page.getByRole("banner").boundingBox();
  expect((await citation.boundingBox())!.y).toBeGreaterThanOrEqual(
    headerBox!.y + headerBox!.height - 1,
  );
});

test("import previews retain the current shortlist until confirmed", async ({ page }) => {
  await page.goto(`/en/collections#member=process%3A${encodeURIComponent(processRef)}`);
  await page.getByLabel(en.Collections.note).fill("Keep this note");
  const incoming = {
    schemaVersion: "tiangong.portal.collections.v1",
    researchName: "Imported shortlist",
    purpose: "",
    members: [{ ref: flowRef, note: "Imported note", status: "candidate" }],
  };
  await page.locator("#collection-import").setInputFiles({
    name: "backup.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(incoming)),
  });
  await expect(page.getByRole("region", { name: en.Collections.importTitle })).toBeVisible();
  await expect(page.getByLabel(en.Collections.note)).toHaveValue("Keep this note");
  await page.getByRole("button", { name: en.Collections.importConfirm }).click();
  await expect(page.getByLabel(en.Collections.note)).toHaveValue("Imported note");
  await expect(page.getByRole("link", { name: "Carbon dioxide", exact: true })).toBeVisible();
});
