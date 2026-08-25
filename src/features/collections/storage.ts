import { z } from "zod";

import { isExactDatasetRef } from "@/features/catalog/exact-ref";

export const collectionsStorageKey = "tiangong.portal.collections.v1";
export const maxCollectionImportBytes = 1_000_000;
export const maxSharedMembers = 20;
export const maxFragmentLength = 1_500;

const codePointString = (maximum: number) =>
  z
    .string()
    .refine((value) => Array.from(value).length <= maximum, `Maximum ${maximum} code points`);

const memberSchema = z
  .object({
    note: codePointString(512).default(""),
    ref: z.string().refine(isExactDatasetRef, "Expected uuid@version"),
    status: z.enum(["candidate", "selected", "excluded"]).default("candidate"),
  })
  .strict();

export const collectionStateSchema = z
  .object({
    members: z.array(memberSchema).max(200),
    purpose: codePointString(512).default(""),
    researchName: codePointString(128).default(""),
    schemaVersion: z.literal("tiangong.portal.collections.v1"),
  })
  .strict();

export type CollectionState = z.infer<typeof collectionStateSchema>;
export type CollectionMember = z.infer<typeof memberSchema>;

export const emptyCollectionState: CollectionState = {
  members: [],
  purpose: "",
  researchName: "",
  schemaVersion: "tiangong.portal.collections.v1",
};

export function parseCollectionJson(raw: string): CollectionState {
  if (new TextEncoder().encode(raw).byteLength > maxCollectionImportBytes) {
    throw new Error("collection_import_too_large");
  }
  const parsed = collectionStateSchema.parse(JSON.parse(raw));
  const uniqueMembers = new Set(parsed.members.map((member) => member.ref));
  if (uniqueMembers.size !== parsed.members.length) throw new Error("collection_duplicate_member");
  return parsed;
}

function toBase64Url(value: string): string {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
}

function fromBase64Url(value: string): string {
  const padded = value
    .replaceAll("-", "+")
    .replaceAll("_", "/")
    .padEnd(Math.ceil(value.length / 4) * 4, "=");
  const binary = atob(padded);
  return new TextDecoder().decode(Uint8Array.from(binary, (character) => character.charCodeAt(0)));
}

export function encodeCollectionFragment(members: CollectionMember[]): string {
  if (members.length > maxSharedMembers) throw new Error("collection_share_member_limit");
  const payload = JSON.stringify({ members: members.map((member) => member.ref), v: 1 });
  const fragment = `#collection=${toBase64Url(payload)}`;
  if (fragment.length > maxFragmentLength) throw new Error("collection_share_fragment_limit");
  return fragment;
}

export function decodeCollectionFragment(fragment: string): string[] {
  const value = fragment.replace(/^#collection=/, "");
  if (!value || fragment.length > maxFragmentLength) throw new Error("collection_share_invalid");
  const parsed = z
    .object({
      members: z.array(z.string().refine(isExactDatasetRef)).max(maxSharedMembers),
      v: z.literal(1),
    })
    .strict()
    .parse(JSON.parse(fromBase64Url(value)));
  return [...new Set(parsed.members)];
}
