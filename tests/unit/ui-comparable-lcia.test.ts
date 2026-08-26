import { describe, expect, it } from "vitest";

import fixture from "../fixtures/portal/catalog-v1.json";

import { mapCompareCandidate } from "@/features/catalog/map-public-data";
import {
  applyComparableLcia,
  shouldRequestComparableLcia,
} from "@/features/compare/comparable-lcia";
import { publicDatasetEnvelopeSchema, publishedLciaPageSchema } from "@/server/contracts/portal";

const secondId = "77777777-7777-7777-7777-777777777777";

function fixtures() {
  const first = publicDatasetEnvelopeSchema.parse({
    ...fixture.datasetProcess,
    metadata: {
      ...fixture.datasetProcess.metadata,
      cutoffRules: [{ language: "en", value: "Cutoff 1%" }],
    },
  });
  const second = publicDatasetEnvelopeSchema.parse({
    ...first,
    key: { ...first.key, id: secondId },
  });
  const basePage = publishedLciaPageSchema.parse(fixture.lcia);
  const firstRow = basePage.rows[0]!;
  const secondRow = {
    ...firstRow,
    process: { ...firstRow.process, id: secondId },
    value: "18.75",
  };
  const rows = [firstRow, secondRow];
  const data = {
    impact: firstRow.impact,
    method: firstRow.method,
    orderedRows: rows,
    publication: basePage.publication,
    unit: firstRow.unit,
    valuesByRef: Object.fromEntries(
      rows.map((row) => [`${row.process.id}@${row.process.version}`, row]),
    ),
  };
  return { data, datasets: [first, second], first, second };
}

describe("comparable LCIA presentation gate", () => {
  it("requests and maps values only after complete metadata compatibility", () => {
    const { data, datasets } = fixtures();
    const candidates = datasets.map((dataset) => mapCompareCandidate(dataset, "en"));

    expect(shouldRequestComparableLcia("climate-change", candidates, datasets)).toBe(true);
    const mapped = applyComparableLcia(candidates, datasets, data, "en");
    expect(mapped?.candidates.map((candidate) => candidate.lciaValue?.value)).toEqual([
      "12.5",
      "18.75",
    ]);
    expect(mapped?.context).toMatchObject({
      impactName: "Climate change",
      publicationRef: "44444444-4444-4444-4444-444444444444",
      unit: "kg CO2-Eq",
    });
  });

  it("does not request or present values for incompatible or incomplete contexts", () => {
    const { data, datasets } = fixtures();
    const candidates = datasets.map((dataset) => mapCompareCandidate(dataset, "en"));
    const incompatible = [candidates[0]!, { ...candidates[1]!, geography: "US" }];
    expect(shouldRequestComparableLcia("climate-change", incompatible, datasets)).toBe(false);

    const conflictedData = {
      ...data,
      orderedRows: data.orderedRows.map((row, index) =>
        index === 1 ? { ...row, geography: { ...row.geography, code: "US" } } : row,
      ),
    };
    expect(applyComparableLcia(candidates, datasets, conflictedData, "en")).toBeNull();
    expect(candidates.every((candidate) => candidate.lciaValue === undefined)).toBe(true);
  });
});
