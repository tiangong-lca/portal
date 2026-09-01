import "server-only";

import { z } from "zod";

import { readPortalLciaEnvironment, type PortalLciaEnvironment } from "@/server/lcia/environment";

export const portalHybridEdgeTimeoutMilliseconds = 30_000;

const hybridEnvironmentSchema = z.strictObject({
  edgeTimeoutMilliseconds: z.coerce
    .number()
    .int()
    .min(250)
    .max(portalHybridEdgeTimeoutMilliseconds)
    .default(portalHybridEdgeTimeoutMilliseconds),
});

export type PortalHybridEnvironment = Omit<PortalLciaEnvironment, "edgeTimeoutMilliseconds"> &
  z.infer<typeof hybridEnvironmentSchema>;

export function readPortalHybridEnvironment(
  environment: Record<string, string | undefined> = process.env,
): PortalHybridEnvironment {
  const baseEnvironment = readPortalLciaEnvironment(environment);
  const hybridEnvironment = hybridEnvironmentSchema.parse({
    edgeTimeoutMilliseconds: environment.PORTAL_HYBRID_EDGE_TIMEOUT_MS,
  });

  return { ...baseEnvironment, ...hybridEnvironment };
}
