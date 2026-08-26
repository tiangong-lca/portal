import { describe, expect, it } from "vitest";

import {
  decodeCollectionFragment,
  encodeCollectionFragment,
  parseCollectionJson,
} from "@/features/collections/storage";

const ref = "00000000-0000-0000-0000-000000000000@01.00.000";

describe("local collection contracts", () => {
  it("shares exact member IDs without notes or decisions", () => {
    const fragment = encodeCollectionFragment([
      { note: "private rationale", ref, status: "excluded" },
    ]);

    expect(decodeCollectionFragment(fragment)).toEqual([ref]);
    expect(fragment).not.toContain("private rationale");
  });

  it("rejects duplicate or server-invalid members during JSON import", () => {
    const base = {
      members: [
        { note: "", ref, status: "candidate" },
        { note: "", ref, status: "selected" },
      ],
      purpose: "",
      researchName: "",
      schemaVersion: "tiangong.portal.collections.v1",
    };
    expect(() => parseCollectionJson(JSON.stringify(base))).toThrow("collection_duplicate_member");
    expect(() =>
      parseCollectionJson(
        JSON.stringify({
          ...base,
          members: [{ note: "", ref: `${ref.slice(0, 36)}@v1`, status: "candidate" }],
        }),
      ),
    ).toThrow("Expected uuid@version");
  });
});
