import { describe, expect, it, vi } from "vitest";

import fixture from "../fixtures/portal/catalog-v1.json";

import { PortalLciaInputError, type PublishedLciaResult } from "@/server/lcia/client";
import {
  getComparablePublishedLciaValues,
  type ComparablePublishedLciaQuery,
} from "@/server/lcia/compare";

const firstReference = {
  id: "11111111-1111-1111-1111-111111111111",
  version: "01.00.000",
};
const secondReference = {
  id: "77777777-7777-7777-7777-777777777777",
  version: "01.00.000",
};
const impactCategoryId = "climate-change";

function availableResult(
  rows: Array<Record<string, unknown>> = [
    { ...fixture.lcia.rows[0]!, process: secondReference },
    fixture.lcia.rows[0]!,
  ],
): PublishedLciaResult {
  return {
    status: "available",
    data: {
      ...fixture.lcia,
      mode: "processes_one_impact",
      rows,
    },
  } as PublishedLciaResult;
}

describe("comparable published LCIA values", () => {
  it("returns complete rows keyed and ordered by the requested exact references", async () => {
    const query = vi.fn<ComparablePublishedLciaQuery>();
    query.mockResolvedValue(availableResult());

    const result = await getComparablePublishedLciaValues(
      { processRefs: [firstReference, secondReference], impactCategoryId },
      { query },
    );

    expect(query).toHaveBeenCalledWith({
      mode: "processes_one_impact",
      processRefs: [firstReference, secondReference],
      impactCategoryId,
      cursor: null,
      limit: 2,
    });
    expect(result.status).toBe("available");
    if (result.status !== "available") throw new Error("Expected available LCIA fixture");
    expect(result.data.orderedRows.map((row) => row.process)).toEqual([
      firstReference,
      secondReference,
    ]);
    expect(result.data.valuesByRef[`${firstReference.id}@${firstReference.version}`]).toMatchObject(
      {
        value: "12.5",
        functionalUnit: { amount: "1", unit: "kWh" },
        geography: { code: "CN", precision: "country" },
        referenceYear: 2024,
        evidenceStatus: "verified",
      },
    );
    expect(result.data).toMatchObject({
      publication: {
        publicationId: fixture.lcia.publication.publicationId,
        packageId: fixture.lcia.publication.packageId,
        packageVersion: fixture.lcia.publication.packageVersion,
        publishedAt: fixture.lcia.publication.publishedAt,
        evidenceHash: fixture.lcia.publication.evidenceHash,
      },
      impact: { id: impactCategoryId },
      method: fixture.lcia.rows[0]!.method,
      unit: "kg CO2-Eq",
    });
    expect(typeof result.data.orderedRows[0]?.value).toBe("string");
  });

  it("returns unavailable rather than zero when any requested Process row is absent", async () => {
    const query = vi.fn<ComparablePublishedLciaQuery>();
    query.mockResolvedValue(availableResult([fixture.lcia.rows[0]!]));

    const result = await getComparablePublishedLciaValues(
      { processRefs: [firstReference, secondReference], impactCategoryId },
      { query },
    );

    expect(result).toEqual({ status: "unavailable", data: null });
    expect(JSON.stringify(result)).not.toContain('"value":0');
  });

  it("fails closed when the bounded response still has unchecked rows", async () => {
    const query = vi.fn<ComparablePublishedLciaQuery>();
    const available = availableResult();
    if (available.status !== "available") throw new Error("Expected available fixture");
    query.mockResolvedValue({
      status: "available",
      data: { ...available.data, nextCursor: "eyJtb3JlIjp0cnVlfQ" },
    });

    await expect(
      getComparablePublishedLciaValues(
        { processRefs: [firstReference, secondReference], impactCategoryId },
        { query },
      ),
    ).resolves.toEqual({ status: "temporarily_unavailable", data: null });
  });

  it.each([
    ["duplicate Process row", [fixture.lcia.rows[0], fixture.lcia.rows[0]]],
    [
      "wrong impact",
      [
        fixture.lcia.rows[0],
        {
          ...fixture.lcia.rows[0],
          process: secondReference,
          impact: { ...fixture.lcia.rows[0]!.impact, id: "acidification" },
        },
      ],
    ],
    [
      "different method",
      [
        fixture.lcia.rows[0],
        {
          ...fixture.lcia.rows[0],
          process: secondReference,
          method: { ...fixture.lcia.rows[0]!.method, version: "02.00.000" },
        },
      ],
    ],
    [
      "different unit",
      [
        fixture.lcia.rows[0],
        { ...fixture.lcia.rows[0], process: secondReference, unit: "g CO2-Eq" },
      ],
    ],
    [
      "incomplete numeric context",
      [
        fixture.lcia.rows[0],
        {
          ...fixture.lcia.rows[0],
          process: secondReference,
          functionalUnit: { ...fixture.lcia.rows[0]!.functionalUnit, amount: null },
        },
      ],
    ],
  ])("fails closed on %s", async (_label, rows) => {
    const query = vi.fn<ComparablePublishedLciaQuery>();
    query.mockResolvedValue(availableResult(rows as Array<Record<string, unknown>>));

    await expect(
      getComparablePublishedLciaValues(
        { processRefs: [firstReference, secondReference], impactCategoryId },
        { query },
      ),
    ).resolves.toEqual({ status: "temporarily_unavailable", data: null });
  });

  it("propagates explicit upstream availability states and collapses thrown failures", async () => {
    const query = vi.fn<ComparablePublishedLciaQuery>();
    query.mockResolvedValueOnce({ status: "unavailable", data: null });
    query.mockResolvedValueOnce({ status: "temporarily_unavailable", data: null });
    query.mockRejectedValueOnce(new Error("internal locator detail"));
    const input = { processRefs: [firstReference, secondReference], impactCategoryId };

    await expect(getComparablePublishedLciaValues(input, { query })).resolves.toEqual({
      status: "unavailable",
      data: null,
    });
    await expect(getComparablePublishedLciaValues(input, { query })).resolves.toEqual({
      status: "temporarily_unavailable",
      data: null,
    });
    await expect(getComparablePublishedLciaValues(input, { query })).resolves.toEqual({
      status: "temporarily_unavailable",
      data: null,
    });
  });

  it("rejects fewer than two, more than four, duplicate, or unbound inputs before querying", async () => {
    const query = vi.fn<ComparablePublishedLciaQuery>();
    const invalidInputs = [
      { processRefs: [firstReference], impactCategoryId },
      { processRefs: [firstReference, firstReference], impactCategoryId },
      {
        processRefs: [
          firstReference,
          secondReference,
          firstReference,
          secondReference,
          firstReference,
        ],
        impactCategoryId,
      },
      { processRefs: [firstReference, secondReference], impactCategoryId: "" },
    ];

    for (const input of invalidInputs) {
      await expect(getComparablePublishedLciaValues(input, { query })).rejects.toBeInstanceOf(
        PortalLciaInputError,
      );
    }
    expect(query).not.toHaveBeenCalled();
  });
});
