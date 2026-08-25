import {
  PortalLciaInputError,
  queryPublishedLciaRaw,
  type PublishedLciaResult,
} from "@/server/lcia/client";

const maximumBodyBytes = 16 * 1024;

function responseBody(result: PublishedLciaResult) {
  return {
    schemaVersion: "portal.lcia-bff.v1" as const,
    status: result.status,
    data: result.data,
  };
}

function jsonResponse(body: Record<string, unknown>, status: number) {
  return Response.json(body, {
    status,
    headers: {
      "cache-control": "no-store",
    },
  });
}

function expectedOrigin(request: Request): string | null {
  const configuredSiteUrl = process.env.SITE_URL;
  try {
    if (configuredSiteUrl) {
      const siteUrl = new URL(configuredSiteUrl);
      const loopback = ["localhost", "127.0.0.1", "[::1]"].includes(siteUrl.hostname);
      if (
        (siteUrl.protocol !== "https:" && !(siteUrl.protocol === "http:" && loopback)) ||
        siteUrl.username !== "" ||
        siteUrl.password !== ""
      ) {
        return null;
      }
      return siteUrl.origin;
    }
    return new URL(request.url).origin;
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (origin !== null) {
    const allowedOrigin = expectedOrigin(request);
    try {
      if (!allowedOrigin || new URL(origin).origin !== allowedOrigin) {
        return jsonResponse({ code: "cross_origin_request" }, 403);
      }
    } catch {
      return jsonResponse({ code: "cross_origin_request" }, 403);
    }
  }

  const contentType = request.headers.get("content-type")?.split(";", 1)[0]?.trim().toLowerCase();
  if (contentType !== "application/json") {
    return jsonResponse({ code: "invalid_request" }, 415);
  }

  const declaredLength = request.headers.get("content-length");
  if (
    declaredLength !== null &&
    /^\d+$/u.test(declaredLength) &&
    Number(declaredLength) > maximumBodyBytes
  ) {
    return jsonResponse({ code: "body_too_large" }, 413);
  }

  const rawBody = new Uint8Array(await request.arrayBuffer());
  if (rawBody.byteLength === 0) {
    return jsonResponse({ code: "invalid_request" }, 400);
  }
  if (rawBody.byteLength > maximumBodyBytes) {
    return jsonResponse({ code: "body_too_large" }, 413);
  }

  try {
    const result = await queryPublishedLciaRaw(rawBody);
    return jsonResponse(
      responseBody(result),
      result.status === "temporarily_unavailable" ? 503 : 200,
    );
  } catch (error) {
    if (error instanceof PortalLciaInputError) {
      return jsonResponse({ code: "invalid_request" }, 400);
    }
    return jsonResponse({ code: "lcia_temporarily_unavailable" }, 503);
  }
}
