import { expect, test, type APIRequestContext } from "@playwright/test";

import environmentFixture from "../fixtures/portal/r1-environments.json" with { type: "json" };

type FixtureReceipts = {
  rpcByName: Record<string, number>;
};

async function fixtureReceipts(request: APIRequestContext): Promise<FixtureReceipts> {
  const response = await request.get("http://127.0.0.1:4328/receipts");
  expect(response.ok()).toBe(true);
  return (await response.json()) as FixtureReceipts;
}

test("deduplicates the exact public detail envelope within one render", async ({
  page,
  request,
}) => {
  const before = await fixtureReceipts(request);
  const response = await page.goto("/zh-CN/process/11111111-1111-1111-1111-111111111111@01.00.000");

  expect(response?.status()).toBe(200);
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Electricity, medium voltage",
  );
  const after = await fixtureReceipts(request);
  expect(
    (after.rpcByName.portal_get_dataset_v1 ?? 0) - (before.rpcByName.portal_get_dataset_v1 ?? 0),
  ).toBe(1);
});

test("routes signed LCIA through the isolated Preview fixture", async ({ page, request }) => {
  const fixtureHealth = await request.get("http://127.0.0.1:4328/health");
  expect(fixtureHealth.ok()).toBe(true);
  expect(await fixtureHealth.json()).toEqual({
    schemaVersion: "portal.r1-fixture-health.v1",
    environment: "preview",
  });

  await page.goto("/zh-CN");
  const result = await page.evaluate(
    async (body) => {
      const response = await fetch("/internal/lcia", {
        method: "POST",
        body: JSON.stringify(body),
        headers: { "content-type": "application/json" },
      });
      return { status: response.status, payload: (await response.json()) as unknown };
    },
    {
      mode: "process_all_impacts",
      processRefs: [{ id: "11111111-1111-1111-1111-111111111111", version: "01.00.000" }],
      impactCategoryId: null,
      cursor: null,
      limit: 20,
    },
  );

  expect(result.status, JSON.stringify(result.payload)).toBe(200);
  expect(result.payload).toMatchObject({
    schemaVersion: "portal.lcia-bff.v1",
    status: "available",
    data: {
      schemaVersion: "portal.published-lcia-page.v1",
      rows: [{ value: "12.5", evidenceStatus: "verified" }],
    },
  });
  expect(JSON.stringify(result.payload)).not.toContain(environmentFixture.preview.hmacSecret);
  expect(JSON.stringify(result.payload)).not.toContain("service_role");
});
