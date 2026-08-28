import { z } from "zod";

import {
  portalHybridSearchRequestSchema,
  type PortalHybridSearchRequest,
} from "@/lib/hybrid-request";
import { decodeFragmentText, encodeFragmentText } from "@/lib/fragment-codec";

export const maximumHybridFragmentLength = 1500;

const hybridSharePayloadSchema = z.strictObject({
  request: portalHybridSearchRequestSchema,
  v: z.literal(1),
});

export function encodeHybridQueryFragment(input: PortalHybridSearchRequest): string {
  const request = portalHybridSearchRequestSchema.parse(input);
  const payload = JSON.stringify({ request, v: 1 });
  const fragment = `#hybrid=${encodeFragmentText(payload)}`;
  if (fragment.length > maximumHybridFragmentLength) {
    throw new Error("hybrid_share_fragment_limit");
  }
  return fragment;
}

export function decodeHybridQueryFragment(fragment: string): PortalHybridSearchRequest {
  if (!fragment.startsWith("#hybrid=") || fragment.length > maximumHybridFragmentLength) {
    throw new Error("hybrid_share_invalid");
  }
  return hybridSharePayloadSchema.parse(
    JSON.parse(decodeFragmentText(fragment.slice("#hybrid=".length))),
  ).request;
}
