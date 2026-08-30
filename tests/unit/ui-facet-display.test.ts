import { describe, expect, it } from "vitest";

import {
  maximumRenderedFacetValuesPerGroup,
  partitionFacetValues,
} from "@/features/catalog/facet-display";

describe("public facet display bounds", () => {
  it("renders at most sixteen values and reports the unrendered remainder", () => {
    const values = Array.from({ length: 100 }, (_, index) => `facet-${String(index)}`);
    const partition = partitionFacetValues(values);

    expect(partition.visible).toEqual(values.slice(0, 8));
    expect(partition.disclosed).toEqual(values.slice(8, 16));
    expect(partition.hiddenCount).toBe(84);
    expect(partition.visible.length + partition.disclosed.length).toBe(
      maximumRenderedFacetValuesPerGroup,
    );
  });

  it("keeps small groups complete without a hidden remainder", () => {
    const values = ["one", "two", "three"];

    expect(partitionFacetValues(values)).toEqual({
      disclosed: [],
      hiddenCount: 0,
      visible: values,
    });
  });
});
