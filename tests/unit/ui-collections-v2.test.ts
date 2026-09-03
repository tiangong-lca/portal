import { describe, expect, it } from "vitest";

import {
  collectionMemberKey,
  decodeCollectionFragmentV2,
  decodeDisclosedCollectionFragmentV2,
  emptyCollectionStateV2,
  encodeCollectionFragmentV2,
  encodeDisclosedCollectionFragmentV2,
  mergeCollectionMembers,
  parseCollectionJsonV2,
  parseMemberFragment,
  buildMemberFragment,
} from "@/features/collections/storage-v2";
import {
  encodeCollectionFragment as encodeCollectionFragmentV1,
  encodeDisclosedCollectionFragment as encodeDisclosedCollectionFragmentV1,
  type CollectionState,
} from "@/features/collections/storage";
import { encodeFragmentText } from "@/lib/fragment-codec";

const processRef = "00000000-0000-0000-0000-000000000000@01.00.000";
const flowRef = "11111111-1111-1111-1111-111111111111@02.00.000";
const sharedUuid = "22222222-2222-2222-2222-222222222222";
const sharedRef = `${sharedUuid}@03.00.000`;

type MemberInput = {
  kind: "process" | "flow" | null;
  note?: string;
  ref: string;
  status?: "candidate" | "selected" | "excluded";
};

function v2Member(
  overrides: Partial<MemberInput> = {},
): MemberInput & { note: string; status: "candidate" | "selected" | "excluded" } {
  return {
    kind: "process",
    note: "",
    ref: processRef,
    status: "candidate",
    ...overrides,
  };
}

describe("collections storage v2 parsing", () => {
  it("migrates V1 JSON to unresolved identities without losing notes or status", () => {
    const legacy = {
      members: [{ note: "keep rationale", ref: processRef, status: "excluded" }],
      purpose: "keep purpose",
      researchName: "keep research",
      schemaVersion: "tiangong.portal.collections.v1",
    };
    const migrated = parseCollectionJsonV2(JSON.stringify(legacy));

    expect(migrated.schemaVersion).toBe("tiangong.portal.collections.v2");
    expect(migrated.researchName).toBe("keep research");
    expect(migrated.purpose).toBe("keep purpose");
    expect(migrated.members).toEqual([
      { kind: null, note: "keep rationale", ref: processRef, status: "excluded" },
    ]);
  });

  it("round-trips a V2 state through parseCollectionJsonV2", () => {
    const state = {
      members: [v2Member({ kind: "flow", ref: flowRef, note: "复核后采用", status: "selected" })],
      purpose: "backup round trip",
      researchName: "备份研究",
      schemaVersion: "tiangong.portal.collections.v2" as const,
    };

    expect(parseCollectionJsonV2(JSON.stringify(state))).toEqual(state);
  });

  it("keeps the same uuid@version across kinds distinct and rejects duplicates", () => {
    const state = {
      ...emptyCollectionStateV2,
      members: [
        v2Member({ kind: "process", ref: sharedRef }),
        v2Member({ kind: "flow", ref: sharedRef, note: "flow twin" }),
      ],
    };
    expect(parseCollectionJsonV2(JSON.stringify(state))).toEqual(state);

    const duplicate = {
      ...emptyCollectionStateV2,
      members: [v2Member(), v2Member({ note: "second" })],
    };
    expect(() => parseCollectionJsonV2(JSON.stringify(duplicate))).toThrow(
      "collection_duplicate_member",
    );
  });

  it("rejects unexpected or private fields and malformed refs, kinds, and statuses", () => {
    const base = {
      purpose: "",
      researchName: "",
      schemaVersion: "tiangong.portal.collections.v2",
      members: [v2Member()],
    };

    expect(() => parseCollectionJsonV2(JSON.stringify({ ...base, extra: "unexpected" }))).toThrow(
      Error,
    );
    expect(() =>
      parseCollectionJsonV2(
        JSON.stringify({
          ...base,
          members: [{ ...base.members[0], apiKey: "leak" }],
        }),
      ),
    ).toThrow(Error);
    expect(() =>
      parseCollectionJsonV2(
        JSON.stringify({
          ...base,
          members: [{ ...base.members[0], ref: "00000000-0000-0000-0000-000000000000@1.0.0" }],
        }),
      ),
    ).toThrow(Error);
    expect(() =>
      parseCollectionJsonV2(
        JSON.stringify({
          ...base,
          members: [{ ...base.members[0], kind: "activity" }],
        }),
      ),
    ).toThrow(Error);
    expect(() =>
      parseCollectionJsonV2(
        JSON.stringify({
          ...base,
          members: [{ ...base.members[0], status: "approved" }],
        }),
      ),
    ).toThrow(Error);
  });

  it("enforces unicode code point limits and the raw byte budget", () => {
    const overName = {
      ...emptyCollectionStateV2,
      researchName: "界".repeat(129),
    };
    expect(() => parseCollectionJsonV2(JSON.stringify(overName))).toThrow(Error);

    const overNote = {
      ...emptyCollectionStateV2,
      members: [v2Member({ note: "界".repeat(513) })],
    };
    expect(() => parseCollectionJsonV2(JSON.stringify(overNote))).toThrow(Error);

    const oversized = JSON.stringify({
      ...emptyCollectionStateV2,
      researchName: "a".repeat(1_000_001),
    });
    expect(() => parseCollectionJsonV2(oversized)).toThrow("collection_import_too_large");
  });

  it("rejects 201 members in stored JSON", () => {
    const members = Array.from({ length: 201 }, (_value, index) => {
      const uuid = `00000000-0000-0000-0000-${String(index).padStart(12, "0")}`;
      return v2Member({ ref: `${uuid}@01.00.000` });
    });
    const state = { ...emptyCollectionStateV2, members };

    expect(() => parseCollectionJsonV2(JSON.stringify(state))).toThrow(Error);
  });
});

describe("mergeCollectionMembers", () => {
  it("appends unknown members, preserves existing notes and status, and stays immutable", () => {
    const state = {
      ...emptyCollectionStateV2,
      members: [v2Member({ kind: null, note: "existing rationale", status: "selected" })],
    };
    const snapshot = JSON.parse(JSON.stringify(state));
    const flowIdentity = { kind: "flow" as const, ref: flowRef };

    const merged = mergeCollectionMembers(state, [
      { kind: null, ref: processRef },
      flowIdentity,
      { kind: null, ref: processRef },
    ]);

    expect(merged.members).toEqual([
      { kind: null, note: "existing rationale", ref: processRef, status: "selected" },
      { kind: "flow", note: "", ref: flowRef, status: "candidate" },
    ]);
    expect(state).toEqual(snapshot);
    expect(mergeCollectionMembers(merged, [{ kind: null, ref: processRef }])).toEqual(merged);
  });

  it("throws instead of truncating beyond 200 members", () => {
    const members = Array.from({ length: 200 }, (_value, index) => {
      const uuid = `00000000-0000-0000-0000-${String(index).padStart(12, "0")}`;
      return v2Member({ ref: `${uuid}@01.00.000` });
    });
    const state = { ...emptyCollectionStateV2, members };

    expect(() =>
      mergeCollectionMembers(state, [
        { kind: "flow", ref: flowRef },
        { kind: "process", ref: processRef },
      ]),
    ).toThrow("collection_member_limit");
  });

  it("validates supplied identities instead of trusting them", () => {
    expect(() =>
      mergeCollectionMembers(emptyCollectionStateV2, [
        { kind: "process", ref: "00000000-0000-0000-0000-000000000000" },
      ]),
    ).toThrow("collection_identity_invalid");
    expect(() =>
      mergeCollectionMembers(emptyCollectionStateV2, [
        { kind: "activity", ref: processRef } as unknown as { kind: null; ref: string },
      ]),
    ).toThrow("collection_identity_invalid");
  });

  it("keeps a stable kind-qualified key with unknown for null kind", () => {
    expect(collectionMemberKey({ kind: null, ref: sharedRef })).toBe(`unknown:${sharedRef}`);
    expect(collectionMemberKey({ kind: "process", ref: sharedRef })).toBe(`process:${sharedRef}`);
    expect(collectionMemberKey({ kind: "flow", ref: sharedRef })).toBe(`flow:${sharedRef}`);
  });
});

describe("ID-only collection fragments", () => {
  it("round-trips typed identities and never carries private text", () => {
    const members = [
      v2Member({ note: "私有理由", status: "excluded" }),
      v2Member({ kind: "flow", ref: flowRef, note: "第二条", status: "selected" }),
      v2Member({ kind: null, ref: sharedRef }),
    ];
    const fragment = encodeCollectionFragmentV2(members);

    expect(fragment).toMatch(/^#collection=/u);
    expect(fragment).not.toContain("私有理由");
    expect(fragment).not.toContain("第二条");
    expect(decodeCollectionFragmentV2(fragment)).toEqual([
      { kind: "process", ref: processRef },
      { kind: "flow", ref: flowRef },
      { kind: null, ref: sharedRef },
    ]);
  });

  it("deduplicates identical qualified identities and keeps cross-kind twins", () => {
    const fragment = encodeCollectionFragmentV2([
      v2Member(),
      v2Member(),
      v2Member({ kind: "flow", ref: sharedRef }),
      v2Member({ kind: null, ref: sharedRef }),
    ]);

    expect(decodeCollectionFragmentV2(fragment)).toEqual([
      { kind: "process", ref: processRef },
      { kind: "flow", ref: sharedRef },
      { kind: null, ref: sharedRef },
    ]);
  });

  it("fits exactly 20 typed identities in the fragment budget and rejects 21", () => {
    const members = Array.from({ length: 20 }, (_value, index) => {
      const uuid = `00000000-0000-0000-0000-${String(index).padStart(12, "0")}`;
      return v2Member({ ref: `${uuid}@01.00.000` });
    });
    const fragment = encodeCollectionFragmentV2(members);

    expect(fragment.length).toBeLessThanOrEqual(1500);
    expect(decodeCollectionFragmentV2(fragment)).toHaveLength(20);

    const members21 = Array.from({ length: 21 }, (_value, index) => {
      const uuid = `00000000-0000-0000-0000-${String(index).padStart(12, "0")}`;
      return v2Member({ ref: `${uuid}@01.00.000` });
    });
    expect(() => encodeCollectionFragmentV2(members21)).toThrow("collection_share_member_limit");
  });
});

describe("legacy ID-only fragments", () => {
  it("decodes V1 member refs to unresolved identities", () => {
    const fragment = encodeCollectionFragmentV1([
      { note: "unused", ref: processRef, status: "candidate" },
    ]);

    expect(decodeCollectionFragmentV2(fragment)).toEqual([{ kind: null, ref: processRef }]);
  });

  it("rejects wrong prefixes, empty payloads, and trailing parameters", () => {
    expect(() => decodeCollectionFragmentV2("#other=abc")).toThrow("collection_share_invalid");
    expect(() => decodeCollectionFragmentV2("#collection=")).toThrow("collection_share_invalid");
    expect(() => decodeCollectionFragmentV2("#collection=abc#trailing")).toThrow(Error);
    const oversized = `#collection=${"a".repeat(1600)}`;
    expect(() => decodeCollectionFragmentV2(oversized)).toThrow("collection_share_invalid");
  });
});

describe("collection notes fragments", () => {
  it("round-trips a disclosed V2 state with members and notes", () => {
    const state = {
      members: [
        v2Member({ kind: "flow", ref: flowRef, note: "保留备注", status: "selected" }),
        v2Member({ kind: null, ref: sharedRef, note: "未解析", status: "excluded" }),
      ],
      purpose: "对照研究",
      researchName: "共享清单",
      schemaVersion: "tiangong.portal.collections.v2" as const,
    };

    const fragment = encodeDisclosedCollectionFragmentV2(state);
    expect(fragment).toMatch(/^#collection-notes=/u);
    expect(fragment).not.toContain("保留备注");
    expect(decodeDisclosedCollectionFragmentV2(fragment)).toEqual(state);
  });

  it("decodes the legacy V1 disclosed format into migrated V2 state", () => {
    const legacyState: CollectionState = {
      members: [{ note: "旧备注", ref: processRef, status: "selected" }],
      purpose: "旧用途",
      researchName: "旧研究名",
      schemaVersion: "tiangong.portal.collections.v1" as const,
    };
    const fragment = encodeDisclosedCollectionFragmentV1(legacyState);

    const decoded = decodeDisclosedCollectionFragmentV2(fragment);
    expect(decoded).toEqual({
      members: [{ kind: null, note: "旧备注", ref: processRef, status: "selected" }],
      purpose: "旧用途",
      researchName: "旧研究名",
      schemaVersion: "tiangong.portal.collections.v2",
    });
  });

  it("rejects oversized or malformed notes fragments", () => {
    const state = {
      members: [v2Member({ kind: "flow", ref: flowRef, note: "界".repeat(480) })],
      purpose: "p",
      researchName: "n",
      schemaVersion: "tiangong.portal.collections.v2" as const,
    };
    expect(() => encodeDisclosedCollectionFragmentV2(state)).toThrow(
      "collection_share_fragment_limit",
    );

    const oversized = `#collection-notes=${"a".repeat(1600)}`;
    expect(() => decodeDisclosedCollectionFragmentV2(oversized)).toThrow(
      "collection_share_invalid",
    );
    expect(() => decodeDisclosedCollectionFragmentV2("#other-notes=abc")).toThrow(
      "collection_share_invalid",
    );
    expect(() => decodeDisclosedCollectionFragmentV2("#collection-notes=")).toThrow(
      "collection_share_invalid",
    );
  });

  it("rejects duplicate members in both generations of disclosed links", () => {
    const member = v2Member();
    const state = { ...emptyCollectionStateV2, members: [member, member] };
    expect(() => encodeDisclosedCollectionFragmentV2(state)).toThrow("collection_duplicate_member");
    const legacy = {
      ...state,
      schemaVersion: "tiangong.portal.collections.v1",
      members: state.members.map(({ kind: _kind, ...entry }) => entry),
    };
    for (const payload of [
      { v: 3, state },
      { v: 2, state: legacy },
    ]) {
      const fragment = `#collection-notes=${encodeFragmentText(JSON.stringify(payload))}`;
      expect(() => decodeDisclosedCollectionFragmentV2(fragment)).toThrow(
        "collection_duplicate_member",
      );
    }
  });

  it("rejects disclosed payloads with unexpected top-level fields", () => {
    const state = {
      members: [v2Member({ kind: "flow", ref: flowRef })],
      purpose: "",
      researchName: "",
      schemaVersion: "tiangong.portal.collections.v2" as const,
    };
    const fragment = encodeDisclosedCollectionFragmentV2(state);
    const payload = JSON.parse(
      Buffer.from(fragment.slice("#collection-notes=".length), "base64url").toString("utf8"),
    );
    payload.privateTag = "should be rejected";

    expect(() =>
      decodeDisclosedCollectionFragmentV2(
        `#collection-notes=${Buffer.from(JSON.stringify(payload), "utf8").toString("base64url").replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/u, "")}`,
      ),
    ).toThrow(Error);
  });
});

describe("member links", () => {
  it("round-trips typed identities through the new member link format", () => {
    expect(parseMemberFragment(buildMemberFragment({ kind: "process", ref: processRef }))).toEqual({
      kind: "process",
      ref: processRef,
    });
    expect(parseMemberFragment(buildMemberFragment({ kind: "flow", ref: flowRef }))).toEqual({
      kind: "flow",
      ref: flowRef,
    });
    expect(parseMemberFragment(buildMemberFragment({ kind: null, ref: sharedRef }))).toEqual({
      kind: null,
      ref: sharedRef,
    });
  });

  it("matches the legacy bare-ref member link to an unresolved identity", () => {
    const fragment = `#member=${encodeURIComponent(processRef)}`;
    expect(parseMemberFragment(fragment)).toEqual({ kind: null, ref: processRef });
    expect(buildMemberFragment({ kind: "process", ref: processRef })).toBe(
      `#member=${encodeURIComponent(`process:${processRef}`)}`,
    );
  });

  it("rejects wrong prefixes, trailing parameters, and malformed refs", () => {
    expect(() => parseMemberFragment("member=process:ref")).toThrow(
      "collection_member_link_invalid",
    );
    expect(() =>
      parseMemberFragment(`#member=${encodeURIComponent(`process:${processRef}`)}&extra=1`),
    ).toThrow("collection_member_link_invalid");
    expect(() =>
      parseMemberFragment(`#member=${encodeURIComponent("activity:" + processRef)}`),
    ).toThrow("collection_member_link_invalid");
    expect(() => parseMemberFragment(`#member=${encodeURIComponent("process:not-a-ref")}`)).toThrow(
      "collection_member_link_invalid",
    );
    expect(() => parseMemberFragment(`#member=${encodeURIComponent("process:")}`)).toThrow(
      "collection_member_link_invalid",
    );
    expect(() => parseMemberFragment("#member=%ZZ")).toThrow("collection_member_link_invalid");
  });
});
