import { describe, expect, it } from "vitest";

import {
  decodeCollectionFragment,
  decodeDisclosedCollectionFragment,
  encodeCollectionFragment,
  encodeDisclosedCollectionFragment,
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

  it("shares notes only through the explicit disclosed fragment", () => {
    const state = {
      members: [{ note: "private rationale", ref, status: "excluded" as const }],
      purpose: "private purpose",
      researchName: "private research",
      schemaVersion: "tiangong.portal.collections.v1" as const,
    };
    const fragment = encodeDisclosedCollectionFragment(state);
    expect(fragment).toMatch(/^#collection-notes=/u);
    expect(decodeDisclosedCollectionFragment(fragment)).toEqual(state);
    expect(() =>
      encodeDisclosedCollectionFragment({
        ...state,
        members: [{ ...state.members[0]!, note: "界".repeat(512) }],
      }),
    ).toThrow("collection_share_fragment_limit");
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
