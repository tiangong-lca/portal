import "server-only";

import { z } from "zod";

const optionalHttpsUrl = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value === "" ? undefined : value))
  .pipe(
    z
      .url()
      .refine((value) => new URL(value).protocol === "https:", "R0 endpoint must use HTTPS")
      .optional(),
  );

const r0EnvironmentSchema = z.object({
  deploymentEnvironment: z.enum(["local", "preview", "production"]).default("local"),
  deploymentSha: z.string().trim().min(1).max(64).default("local"),
  endpoint: optionalHttpsUrl,
  keyId: z.string().trim().optional(),
  secret: z.string().trim().optional(),
  publishableKey: z.string().trim().optional(),
});

export type R0CompatEnvironment = z.infer<typeof r0EnvironmentSchema>;

export function readR0CompatEnvironment(
  environment: Record<string, string | undefined> = process.env,
): R0CompatEnvironment {
  const parsed = r0EnvironmentSchema.parse({
    deploymentEnvironment: environment.PORTAL_DEPLOYMENT_ENV,
    deploymentSha: environment.PORTAL_DEPLOYMENT_SHA,
    endpoint: environment.R0_COMPAT_EDGE_ENDPOINT,
    keyId: environment.R0_COMPAT_KEY_ID,
    secret: environment.R0_COMPAT_HMAC_SECRET,
    publishableKey: environment.SUPABASE_PUBLISHABLE_KEY,
  });

  const configured = [parsed.endpoint, parsed.keyId, parsed.secret, parsed.publishableKey];
  const configuredCount = configured.filter(Boolean).length;

  if (configuredCount !== 0 && configuredCount !== configured.length) {
    throw new Error("R0 HMAC fixture configuration must be complete or entirely absent");
  }

  return parsed;
}
