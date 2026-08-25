import { readR0CompatEnvironment } from "@/server/r0-compat/env";

export const dynamic = "force-dynamic";

export function GET() {
  const environment = readR0CompatEnvironment();

  return Response.json(
    {
      schemaVersion: "portal.r0-route-handler.v1",
      deploymentEnvironment: environment.deploymentEnvironment,
      deploymentSha: environment.deploymentSha,
      runtimeVersion: process.version,
    },
    {
      headers: {
        "cache-control": "no-store",
        "x-robots-tag": "noindex, nofollow",
      },
    },
  );
}
