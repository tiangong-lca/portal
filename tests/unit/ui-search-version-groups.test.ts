import { describe, expect, it } from "vitest";

import { groupSearchResults } from "@/features/catalog/search-version-groups";
import type { CatalogResultViewModel } from "@/features/catalog/view-model";

function item(id: string, version: string): CatalogResultViewModel {
  return {
    kind: "process",
    ref: `${id}@${version}`,
    name: `${id} ${version}`,
    accessLevel: "open",
  };
}

describe("matching version presentation", () => {
  it("preserves upstream dataset order and the best representative without summing version counts", () => {
    const items = [
      item("a", "01.00.000"),
      item("b", "01.00.000"),
      item("a", "02.00.000"),
      item("a", "00.99.999"),
    ];
    const groups = groupSearchResults(items);
    expect(groups.map((group) => group.ref)).toEqual(["a@01.00.000", "b@01.00.000"]);
    expect(groups[0]!.matchingVersions?.map((match) => match.ref)).toEqual([
      "a@02.00.000",
      "a@00.99.999",
    ]);
    expect(items[0]!.matchingVersions).toBeUndefined();
  });

  it("deduplicates exact identities while keeping kind and version distinct", () => {
    const first = {
      ...item("a", "01.00.000"),
      matchingVersions: [{ ref: "a@00.99.999", version: "00.99.999" }],
    };
    const groups = groupSearchResults([
      first,
      first,
      item("a", "00.99.999"),
      { ...item("a", "01.00.000"), kind: "flow" },
    ]);
    expect(groups).toHaveLength(2);
    expect(groups[0]!.matchingVersions).toHaveLength(1);
  });
});
