import { expect, test } from "@playwright/test";

import hmacFixture from "../fixtures/hmac/portal-hmac-v1.json" with { type: "json" };
import environmentFixture from "../fixtures/portal/r1-environments.json" with { type: "json" };
import forbiddenBrowserMarkers from "../fixtures/security/browser-private-markers.json" with { type: "json" };

const processRef = "11111111-1111-1111-1111-111111111111@01.00.000";
const forbiddenResponseMarkers = [
  ...forbiddenBrowserMarkers,
  hmacFixture.secret,
  environmentFixture.preview.hmacSecret,
  environmentFixture.production.hmacSecret,
];

for (const path of [
  "/en",
  "/en/search?v=1&kind=process&q=electricity",
  `/en/process/${processRef}`,
  `/en/process/${processRef}/lcia`,
]) {
  test(`keeps secrets and internal locators out of ${path}`, async ({ request }) => {
    const response = await request.get(path);
    expect(response.ok()).toBe(true);
    expect(response.headers()["referrer-policy"]).toBe("strict-origin-when-cross-origin");
    const body = await response.text();
    for (const marker of forbiddenResponseMarkers) {
      expect(body).not.toContain(marker);
    }
  });
}

test("discloses lexical-query access logging without exposing public sourcemaps", async ({
  page,
  request,
}) => {
  await page.goto("/en/search?v=1&kind=process&q=electricity");
  await expect(
    page.getByText(
      "GET queries appear in browser history and platform access logs. Do not enter confidential information.",
    ),
  ).toBeVisible();

  const scripts = await page
    .locator('script[src*="/_next/static/"]')
    .evaluateAll((elements) =>
      elements
        .map((element) => element.getAttribute("src"))
        .filter((source): source is string => Boolean(source)),
    );
  expect(scripts.length).toBeGreaterThan(0);
  for (const source of scripts) {
    expect((await request.get(`${source}.map`)).status()).toBe(404);
  }
});
