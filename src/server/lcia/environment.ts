import "server-only";

import { z } from "zod";

import { readPortalDataEnvironment, type PortalDataEnvironment } from "@/server/data/environment";
import { validatePortalHmacCredentials } from "@/server/r0-compat/hmac";

const loopbackHosts = new Set(["localhost", "127.0.0.1", "[::1]"]);

const edgeOriginSchema = z
  .url()
  .transform((value) => new URL(value))
  .refine(
    (url) =>
      url.protocol === "https:" || (url.protocol === "http:" && loopbackHosts.has(url.hostname)),
    "Portal Edge endpoint must use HTTPS (except loopback development)",
  )
  .refine(
    (url) =>
      url.username === "" &&
      url.password === "" &&
      url.pathname === "/" &&
      url.search === "" &&
      url.hash === "",
    "Portal Edge endpoint must be a credential-free origin",
  )
  .transform((url) => url.origin);

const lciaEnvironmentSchema = z.strictObject({
  edgeOrigin: edgeOriginSchema,
  keyId: z
    .string()
    .trim()
    .regex(/^[A-Za-z0-9._-]{1,64}$/),
  secret: z
    .string()
    .trim()
    .regex(/^[A-Za-z0-9_-]+$/),
  edgeTimeoutMilliseconds: z.coerce.number().int().min(250).max(8000).default(8000),
});

export type PortalLciaEnvironment = PortalDataEnvironment & z.infer<typeof lciaEnvironmentSchema>;

export function readPortalLciaEnvironment(
  environment: Record<string, string | undefined> = process.env,
): PortalLciaEnvironment {
  const dataEnvironment = readPortalDataEnvironment(environment);
  const lciaEnvironment = lciaEnvironmentSchema.parse({
    edgeOrigin: environment.PORTAL_EDGE_ENDPOINT || environment.SUPABASE_URL,
    keyId: environment.PORTAL_EDGE_KEY_ID,
    secret: environment.PORTAL_EDGE_HMAC_SECRET,
    edgeTimeoutMilliseconds: environment.PORTAL_EDGE_TIMEOUT_MS,
  });

  validatePortalHmacCredentials(lciaEnvironment.keyId, lciaEnvironment.secret);

  return { ...dataEnvironment, ...lciaEnvironment };
}
