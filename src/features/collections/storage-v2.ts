import { z } from "zod";

import { isExactDatasetRef } from "@/features/catalog/exact-ref";
import {
  collectionStateSchema,
  maxCollectionImportBytes,
  maxFragmentLength,
  maxSharedMembers,
  parseCollectionJson,
  type CollectionState,
} from "@/features/collections/storage";
import { decodeFragmentText, encodeFragmentText } from "@/lib/fragment-codec";

export const collectionsStorageKeyV2 = "tiangong.portal.collections.v2";

export type DatasetKind = "process" | "flow";
export type DatasetIdentity = { kind: DatasetKind | null; ref: string };
export type CollectionMemberV2 = DatasetIdentity & {
  note: string;
  status: "candidate" | "selected" | "excluded";
};
export type CollectionStateV2 = {
  schemaVersion: "tiangong.portal.collections.v2";
  researchName: string;
  purpose: string;
  members: CollectionMemberV2[];
};

const maxCollectionMembers = 200;

const codePointString = (maximum: number) =>
  z
    .string()
    .refine((value) => Array.from(value).length <= maximum, `Maximum ${maximum} code points`);

const memberSchemaV2 = z
  .object({
    kind: z.enum(["process", "flow"]).nullable(),
    note: codePointString(512),
    ref: z.string().refine(isExactDatasetRef, "Expected uuid@version"),
    status: z.enum(["candidate", "selected", "excluded"]),
  })
  .strict();

export const collectionStateSchemaV2 = z
  .object({
    members: z.array(memberSchemaV2).max(maxCollectionMembers),
    purpose: codePointString(512),
    researchName: codePointString(128),
    schemaVersion: z.literal("tiangong.portal.collections.v2"),
  })
  .strict();

export const emptyCollectionStateV2: CollectionStateV2 = {
  members: [],
  purpose: "",
  researchName: "",
  schemaVersion: "tiangong.portal.collections.v2",
};

export function collectionMemberKey(identity: DatasetIdentity): string {
  return `${identity.kind ?? "unknown"}:${identity.ref}`;
}

function parseSuppliedIdentity(identity: DatasetIdentity): DatasetIdentity {
  if (
    (identity?.kind === "process" || identity?.kind === "flow" || identity?.kind === null) &&
    typeof identity.ref === "string" &&
    isExactDatasetRef(identity.ref)
  ) {
    return { kind: identity.kind, ref: identity.ref };
  }
  throw new Error("collection_identity_invalid");
}

function ensureUniqueMembersV2(members: CollectionMemberV2[]): void {
  const keys = new Set(members.map((member) => collectionMemberKey(member)));
  if (keys.size !== members.length) throw new Error("collection_duplicate_member");
}

function migrateLegacyState(state: CollectionState): CollectionStateV2 {
  return {
    members: state.members.map((member) => ({ ...member, kind: null })),
    purpose: state.purpose,
    researchName: state.researchName,
    schemaVersion: "tiangong.portal.collections.v2",
  };
}

export function parseCollectionJsonV2(raw: string): CollectionStateV2 {
  if (new TextEncoder().encode(raw).byteLength > maxCollectionImportBytes) {
    throw new Error("collection_import_too_large");
  }
  const value: unknown = JSON.parse(raw);
  const parsedV2 = collectionStateSchemaV2.safeParse(value);
  if (parsedV2.success) {
    ensureUniqueMembersV2(parsedV2.data.members);
    return parsedV2.data;
  }
  // Legacy exports stay readable through the existing strict V1 parser, which
  // also enforces the import size and duplicate-ref rules.
  return migrateLegacyState(parseCollectionJson(raw));
}

export function mergeCollectionMembers(
  state: CollectionStateV2,
  identities: DatasetIdentity[],
): CollectionStateV2 {
  const existingByKey = new Map(
    state.members.map((member) => [collectionMemberKey(member), member]),
  );
  const additions: CollectionMemberV2[] = [];
  for (const identity of identities) {
    const validated = parseSuppliedIdentity(identity);
    const key = collectionMemberKey(validated);
    if (existingByKey.has(key)) continue;
    const member: CollectionMemberV2 = { ...validated, note: "", status: "candidate" };
    existingByKey.set(key, member);
    additions.push(member);
  }
  const members = [...state.members, ...additions];
  if (members.length > maxCollectionMembers) throw new Error("collection_member_limit");
  return { ...state, members };
}

const idOnlyFragmentPrefix = "#collection=";
const notesFragmentPrefix = "#collection-notes=";
const memberFragmentPrefix = "#member=";

function typedMemberEntrySchema() {
  return z.string().refine((value) => {
    const match = /^(?:p|f|u):(.+)$/u.exec(value);
    return match !== null && isExactDatasetRef(match[1]!);
  }, "Expected a p/f/u prefixed uuid@version");
}

const sharedIdentitiesPayloadLegacySchema = z
  .object({
    members: z.array(z.string().refine(isExactDatasetRef)).max(maxSharedMembers),
    v: z.literal(1),
  })
  .strict();

const sharedIdentitiesPayloadV2Schema = z
  .object({ m: z.array(typedMemberEntrySchema()).max(maxSharedMembers), v: z.literal(2) })
  .strict();

function identityToTypedEntry(identity: DatasetIdentity): string {
  const prefix = identity.kind === "process" ? "p" : identity.kind === "flow" ? "f" : "u";
  return `${prefix}:${identity.ref}`;
}

function typedEntryToIdentity(entry: string): DatasetIdentity {
  const match = /^(p|f|u):(.+)$/u.exec(entry);
  const prefix = match![1]!;
  return { kind: prefix === "p" ? "process" : prefix === "f" ? "flow" : null, ref: match![2]! };
}

export function encodeCollectionFragmentV2(members: CollectionMemberV2[]): string {
  if (members.length > maxSharedMembers) throw new Error("collection_share_member_limit");
  const payload = JSON.stringify({
    m: members.map((member) => identityToTypedEntry(parseSuppliedIdentity(member))),
    v: 2,
  });
  const fragment = `${idOnlyFragmentPrefix}${encodeFragmentText(payload)}`;
  if (fragment.length > maxFragmentLength) throw new Error("collection_share_fragment_limit");
  return fragment;
}

export function decodeCollectionFragmentV2(fragment: string): DatasetIdentity[] {
  if (!fragment.startsWith(idOnlyFragmentPrefix) || fragment.length > maxFragmentLength) {
    throw new Error("collection_share_invalid");
  }
  const value = fragment.slice(idOnlyFragmentPrefix.length);
  if (!value) throw new Error("collection_share_invalid");
  const payload: unknown = JSON.parse(decodeFragmentText(value));
  const legacy = sharedIdentitiesPayloadLegacySchema.safeParse(payload);
  if (legacy.success) {
    return [...new Set(legacy.data.members)].map((ref) => ({ kind: null, ref }));
  }
  const typed = sharedIdentitiesPayloadV2Schema.parse(payload);
  const identities = typed.m.map(typedEntryToIdentity);
  return [
    ...new Map(identities.map((identity) => [collectionMemberKey(identity), identity])).values(),
  ];
}

const disclosedPayloadLegacySchema = z
  .object({ state: collectionStateSchema, v: z.literal(2) })
  .strict()
  .refine((value) => value.state.members.length <= maxSharedMembers, {
    message: "collection_share_member_limit",
    path: ["state", "members"],
  });

const disclosedPayloadV2Schema = z
  .object({ state: collectionStateSchemaV2, v: z.literal(3) })
  .strict()
  .refine((value) => value.state.members.length <= maxSharedMembers, {
    message: "collection_share_member_limit",
    path: ["state", "members"],
  });

export function encodeDisclosedCollectionFragmentV2(state: CollectionStateV2): string {
  const payload = disclosedPayloadV2Schema.parse({ state, v: 3 });
  ensureUniqueMembersV2(payload.state.members);
  const fragment = `${notesFragmentPrefix}${encodeFragmentText(JSON.stringify(payload))}`;
  if (fragment.length > maxFragmentLength) throw new Error("collection_share_fragment_limit");
  return fragment;
}

export function decodeDisclosedCollectionFragmentV2(fragment: string): CollectionStateV2 {
  if (!fragment.startsWith(notesFragmentPrefix) || fragment.length > maxFragmentLength) {
    throw new Error("collection_share_invalid");
  }
  const notesValue = fragment.slice(notesFragmentPrefix.length);
  if (!notesValue) throw new Error("collection_share_invalid");
  const payload: unknown = JSON.parse(decodeFragmentText(notesValue));
  const legacy = disclosedPayloadLegacySchema.safeParse(payload);
  const state = legacy.success
    ? migrateLegacyState(legacy.data.state)
    : disclosedPayloadV2Schema.parse(payload).state;
  ensureUniqueMembersV2(state.members);
  return state;
}

export function buildMemberFragment(identity: DatasetIdentity): string {
  const validated = parseSuppliedIdentity(identity);
  return `${memberFragmentPrefix}${encodeURIComponent(collectionMemberKey(validated))}`;
}

export function parseMemberFragment(fragment: string): DatasetIdentity {
  if (!fragment.startsWith(memberFragmentPrefix) || fragment.length > maxFragmentLength) {
    throw new Error("collection_member_link_invalid");
  }
  const encoded = fragment.slice(memberFragmentPrefix.length);
  if (!encoded || encoded.includes("&")) throw new Error("collection_member_link_invalid");
  let decoded: string;
  try {
    decoded = decodeURIComponent(encoded);
  } catch {
    throw new Error("collection_member_link_invalid");
  }
  if (isExactDatasetRef(decoded)) return { kind: null, ref: decoded };
  const match = /^(process|flow|unknown):(.+)$/u.exec(decoded);
  if (!match || !isExactDatasetRef(match[2]!)) throw new Error("collection_member_link_invalid");
  return {
    kind: match[1] === "process" ? "process" : match[1] === "flow" ? "flow" : null,
    ref: match[2]!,
  };
}
