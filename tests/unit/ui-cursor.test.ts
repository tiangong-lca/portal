import { describe, expect, it } from "vitest";

import { safePublicCursor } from "@/features/catalog/cursor";

describe("public cursor URL boundary", () => {
  it("accepts opaque server cursors and rejects unsafe or repeated values", () => {
    expect(safePublicCursor("eyJ2IjoxfQ")).toBe("eyJ2IjoxfQ");
    expect(safePublicCursor(["first", "second"])).toBe("first");
    expect(safePublicCursor("bad cursor")).toBeNull();
    expect(safePublicCursor("../internal")).toBeNull();
    expect(safePublicCursor("x".repeat(4097))).toBeNull();
  });
});
