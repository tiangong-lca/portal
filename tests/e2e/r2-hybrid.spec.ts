import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const processRef = "11111111-1111-1111-1111-111111111111@01.00.000";
const fixtureOrigin = `http://127.0.0.1:${process.env.PORTAL_FIXTURE_PORT ?? "4328"}`;

test("runs private-by-default Hybrid discovery and keeps evidence comparable", async ({
  context,
  page,
  request,
}) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/en/search?v=1");
  const bffResponsePromise = page.waitForResponse(
    (response) =>
      response.url().endsWith("/internal/hybrid") && response.request().method() === "POST",
  );
  const query = "low-carbon electricity for an industrial site in China";
  await page.getByLabel("Natural-language need").fill(query);
  await page.getByRole("button", { name: "Search by description" }).click();
  const bffResponse = await bffResponsePromise;

  expect(bffResponse.ok()).toBe(true);
  await expect(page).toHaveURL(/\/en\/search\?v=1$/u);
  await expect(
    page.getByRole("heading", { name: "How your description was interpreted" }),
  ).toBeVisible();
  await expect(page.getByText("This wording helps the search", { exact: false })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Suggested public datasets" })).toBeVisible();
  await expect(page.getByText("Electricity, medium voltage", { exact: true })).toBeVisible();
  await expect(page.getByText("Text content", { exact: true }).first()).toBeVisible();
  expect(page.url()).not.toContain(encodeURIComponent(query));

  const serious = (await new AxeBuilder({ page }).analyze()).violations.filter(
    ({ impact }) => impact === "serious" || impact === "critical",
  );
  expect(serious).toEqual([]);

  const correlationId = bffResponse.headers()["x-portal-correlation-id"];
  expect(correlationId).toMatch(/^[0-9a-f-]{36}$/u);
  const receipt = await request.get(`${fixtureOrigin}/receipts/hybrid/${correlationId}`);
  expect(receipt.ok()).toBe(true);
  const receiptBody = await receipt.text();
  expect(receiptBody).toContain("portal.r2-fixture-hybrid-receipt.v1");
  expect(receiptBody).not.toContain(query);

  await page.getByRole("button", { name: "Preview shared link" }).click();
  await expect(page.getByRole("heading", { name: "What the link will include" })).toBeVisible();
  await expect(page.getByText(query, { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Confirm and copy query link" }).click();
  const shared = await page.evaluate(() => navigator.clipboard.readText());
  expect(shared).toContain("#hybrid=");
  expect(shared).not.toContain(query);

  const candidates = page.getByRole("checkbox", { name: "Select this Process" });
  await expect(candidates).toHaveCount(2);
  await candidates.nth(0).check();
  await candidates.nth(1).check();
  await page.getByRole("button", { name: "Compare selected Process datasets" }).click();
  await expect(page).toHaveURL(/\/en\/compare\?/u);
  await expect(page.getByRole("heading", { name: "Compare Process datasets" })).toBeVisible();
});

test("automatically returns lexical cards for a fixed Hybrid guard rejection", async ({ page }) => {
  await page.goto("/en/search?v=1");
  const query = "fixture:guard_unavailable";
  await page.getByLabel("Natural-language need").fill(query);
  await page.getByRole("button", { name: "Search by description" }).click();

  await expect(page.getByText("Standard search results", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("alert").filter({ hasText: "Standard search results" }),
  ).not.toContainText("guard_unavailable");
  await expect(page.getByText("Electricity, medium voltage", { exact: true })).toBeVisible();
  await expect(page).toHaveURL(/\/en\/search\?v=1$/u);
  expect(page.url()).not.toContain(query);
});

test("shares collection notes only after preview and second confirmation", async ({
  browser,
  context,
  page,
}) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/en/collections");
  await page.getByLabel("Exact dataset identifier").fill(processRef);
  await page.getByRole("button", { name: "Add to shortlist" }).click();
  await page.getByLabel("Research name").fill("Private research name");
  await page.getByLabel("Purpose").fill("Private purpose");
  await page.getByLabel("Local note or rationale").fill("Private local note");
  await page.evaluate(() => navigator.clipboard.writeText("sentinel"));

  await page.getByRole("button", { name: "Preview share with notes" }).click();
  await expect(page.getByRole("heading", { name: "Disclosure preview" })).toBeVisible();
  await expect(page.getByText("Private local note", { exact: true })).toBeVisible();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe("sentinel");

  await page.getByRole("button", { name: "Confirm and copy disclosed link" }).click();
  const shared = await page.evaluate(() => navigator.clipboard.readText());
  expect(shared).toContain("#collection-notes=");
  expect(shared).not.toContain("Private local note");

  const receiverContext = await browser.newContext();
  try {
    const receiver = await receiverContext.newPage();
    await receiver.goto(shared);
    await expect(receiver.getByLabel("Research name")).toHaveValue("Private research name");
    await expect(receiver.getByLabel("Purpose")).toHaveValue("Private purpose");
    await expect(receiver.getByLabel("Local note or rationale")).toHaveValue("Private local note");
  } finally {
    await receiverContext.close();
  }
});
