import "server-only";

import { z } from "zod";

import {
  localizedTextSchema,
  portalAccessLevelSchema,
  portalDateTimeSchema,
  portalDatasetKindSchema,
  portalNullableYearSchema,
  portalSha256Schema,
  publicCapabilitiesSchema,
  publicCardContextSchema,
  publicDatasetKeySchema,
  publicSearchItemSchema,
  geographySchema,
} from "@/server/contracts/portal";

const nonNegativeCanonicalDecimalPattern =
  /^(?=(?:[^0-9]*[0-9]){1,38}[^0-9]*$)(?:0|(?:[1-9]\d*(?:\.\d*[1-9])?|0\.\d*[1-9]))$/u;

const hybridReasonCodeSchema = z.enum(["lexical_public_projection", "semantic_public_projection"]);

const hybridEvidenceSchema = z
  .strictObject({
    lexicalRank: z.number().int().min(1).nullable(),
    semanticRank: z.number().int().min(1).nullable(),
    semanticDistance: z.string().regex(nonNegativeCanonicalDecimalPattern).nullable(),
  })
  .refine(
    (value) => (value.semanticRank === null) === (value.semanticDistance === null),
    "semantic rank and distance must be present together",
  );

export const portalPublicHybridMatchSchema = z
  .strictObject({
    kind: z.literal("hybrid"),
    algorithmVersion: z.literal("portal-hybrid-rank-v1"),
    score: z.number().min(0).max(1),
    reasonCodes: z
      .array(hybridReasonCodeSchema)
      .min(1)
      .max(2)
      .refine((values) => new Set(values).size === values.length, "reasonCodes must be unique"),
    evidence: hybridEvidenceSchema,
  })
  .superRefine((value, context) => {
    const lexicalReason = value.reasonCodes.includes("lexical_public_projection");
    const semanticReason = value.reasonCodes.includes("semantic_public_projection");
    if (lexicalReason !== (value.evidence.lexicalRank !== null)) {
      context.addIssue({
        code: "custom",
        message: "lexical evidence and reason code must correspond",
        path: ["reasonCodes"],
      });
    }
    if (
      semanticReason !==
      (value.evidence.semanticRank !== null && value.evidence.semanticDistance !== null)
    ) {
      context.addIssue({
        code: "custom",
        message: "semantic evidence and reason code must correspond",
        path: ["reasonCodes"],
      });
    }
  });

export const portalPublicHybridCandidateSchema = z.strictObject({
  key: publicDatasetKeySchema,
  accessLevel: portalAccessLevelSchema,
  capabilities: publicCapabilitiesSchema,
  names: localizedTextSchema,
  summary: localizedTextSchema,
  geography: geographySchema,
  referenceYear: portalNullableYearSchema,
  context: publicCardContextSchema,
  modifiedAt: portalDateTimeSchema,
  match: portalPublicHybridMatchSchema,
});

export const portalHybridInterpretationSchema = z.strictObject({
  source: z.literal("model_generated"),
  advisory: z.literal(true),
  semanticQuery: z.string().min(1).max(512),
  terms: z
    .array(
      z.strictObject({
        language: z.enum(["en", "zh-CN"]),
        value: z.string().min(1).max(512),
      }),
    )
    .min(1)
    .max(12)
    .refine(
      (values) =>
        new Set(values.map((value) => `${value.language}\u0000${value.value}`)).size ===
        values.length,
      "interpretation terms must be unique",
    ),
});

export const portalHybridSearchPageSchema = z
  .strictObject({
    schemaVersion: z.literal("portal.hybrid-search-page.v1"),
    kind: portalDatasetKindSchema,
    queryFingerprint: portalSha256Schema,
    interpretation: portalHybridInterpretationSchema,
    items: z.array(portalPublicHybridCandidateSchema).max(20),
  })
  .superRefine((value, context) => {
    const candidateKeys = value.items.map(
      (item) => `${item.key.kind}:${item.key.id}@${item.key.version}`,
    );
    if (new Set(candidateKeys).size !== candidateKeys.length) {
      context.addIssue({
        code: "custom",
        message: "candidate identities must be unique",
        path: ["items"],
      });
    }
    value.items.forEach((item, index) => {
      if (item.key.kind !== value.kind) {
        context.addIssue({
          code: "custom",
          message: "candidate kind must match page kind",
          path: ["items", index, "key", "kind"],
        });
      }
    });
  });

export const portalHybridFallbackReasonSchema = z.enum([
  "method_not_allowed",
  "request_too_large",
  "portal_auth_unavailable",
  "portal_auth_failed",
  "hybrid_disabled",
  "guard_unavailable",
  "replay_rejected",
  "budget_exhausted",
  "concurrency_exhausted",
  "circuit_open",
  "invalid_request",
  "hybrid_timeout",
  "hybrid_upstream_unavailable",
  "contract_failure",
  "internal_error",
]);

export const portalHybridErrorPayloadSchema = z.strictObject({
  code: portalHybridFallbackReasonSchema,
  message: z.string().min(1).max(256),
});

const hybridBffSuccessSchema = z.strictObject({
  schemaVersion: z.literal("portal.hybrid-bff.v1"),
  mode: z.literal("hybrid"),
  kind: portalDatasetKindSchema,
  queryFingerprint: portalSha256Schema,
  fallbackReason: z.null(),
  interpretation: portalHybridInterpretationSchema,
  items: z.array(portalPublicHybridCandidateSchema).max(20),
});

const hybridBffFallbackSchema = z.strictObject({
  schemaVersion: z.literal("portal.hybrid-bff.v1"),
  mode: z.literal("lexical_fallback"),
  kind: portalDatasetKindSchema,
  queryFingerprint: portalSha256Schema,
  fallbackReason: portalHybridFallbackReasonSchema,
  interpretation: z.null(),
  items: z.array(publicSearchItemSchema).max(20),
});

export const portalHybridBffResponseSchema = z
  .discriminatedUnion("mode", [hybridBffSuccessSchema, hybridBffFallbackSchema])
  .superRefine((value, context) => {
    value.items.forEach((item, index) => {
      if (item.key.kind !== value.kind) {
        context.addIssue({
          code: "custom",
          message: "item kind must match response kind",
          path: ["items", index, "key", "kind"],
        });
      }
    });
  });

export type PortalHybridCandidate = z.infer<typeof portalPublicHybridCandidateSchema>;
export type PortalHybridSearchPage = z.infer<typeof portalHybridSearchPageSchema>;
export type PortalHybridFallbackReason = z.infer<typeof portalHybridFallbackReasonSchema>;
export type PortalHybridBffResponse = z.infer<typeof portalHybridBffResponseSchema>;
