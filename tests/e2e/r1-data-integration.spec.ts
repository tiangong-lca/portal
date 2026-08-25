import { expect, test } from "@playwright/test";

import environmentFixture from "../fixtures/portal/r1-environments.json" with { type: "json" };

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
