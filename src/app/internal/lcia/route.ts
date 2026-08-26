import {
  PortalLciaInputError,
  queryPublishedLciaRaw,
  type PublishedLciaResult,
} from "@/server/lcia/client";
import {
  createPortalCorrelationId,
  defaultPortalTelemetryLogger,
  emitPortalTelemetry,
  portalLatencyMilliseconds,
  type PortalTelemetryEvent,
  type PortalTelemetryLogger,
} from "@/server/telemetry/logger";

const maximumBodyBytes = 16 * 1024;

class PortalBodyTooLargeError extends Error {}

async function readBoundedBody(request: Request): Promise<Uint8Array> {
  if (!request.body) {
    return new Uint8Array();
  }

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      totalBytes += value.byteLength;
      if (totalBytes > maximumBodyBytes) {
        try {
          await reader.cancel();
        } catch {
          // The bounded read has already failed closed.
        }
        throw new PortalBodyTooLargeError();
      }

      const stableChunk = new Uint8Array(value.byteLength);
      stableChunk.set(value);
      chunks.push(stableChunk);
    }
  } finally {
    reader.releaseLock();
  }

  const body = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return body;
}

function responseBody(result: PublishedLciaResult) {
  return {
    schemaVersion: "portal.lcia-bff.v1" as const,
    status: result.status,
    data: result.data,
  };
}

function jsonResponse(body: Record<string, unknown>, status: number, correlationId: string) {
  return Response.json(body, {
    status,
    headers: {
      "cache-control": "no-store",
      "x-portal-correlation-id": correlationId,
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

type PortalLciaRouteDependencies = {
  logger?: PortalTelemetryLogger;
  query?: typeof queryPublishedLciaRaw;
  correlationId?: () => string;
  now?: () => number;
  telemetryEnvironment?: Record<string, string | undefined>;
};

export function createPortalLciaPostHandler(dependencies: PortalLciaRouteDependencies = {}) {
  const logger = dependencies.logger ?? defaultPortalTelemetryLogger;
  const query = dependencies.query ?? queryPublishedLciaRaw;
  const now = dependencies.now ?? (() => performance.now());
  const telemetryEnvironment = dependencies.telemetryEnvironment ?? process.env;

  return async function portalLciaPost(request: Request): Promise<Response> {
    const startedAt = now();
    const correlationId = createPortalCorrelationId(
      request.headers.get("x-portal-correlation-id") ?? undefined,
      dependencies.correlationId,
    );
    const respond = (
      body: Record<string, unknown>,
      httpStatus: number,
      status: PortalTelemetryEvent["status"],
      errorCode: PortalTelemetryEvent["errorCode"],
      rowCount: number | null,
      backend: PortalTelemetryEvent["backend"],
    ) => {
      emitPortalTelemetry(
        logger,
        {
          correlationId,
          routeFamily: "lcia_bff",
          rpcName: null,
          cachePolicy: "no-store",
          cacheHit: "unknown",
          backend,
          latencyMs: portalLatencyMilliseconds(startedAt, now()),
          rowCount,
          status,
          errorCode,
        },
        telemetryEnvironment,
      );
      return jsonResponse(body, httpStatus, correlationId);
    };

    const origin = request.headers.get("origin");
    if (origin !== null) {
      const allowedOrigin = expectedOrigin(request);
      try {
        if (!allowedOrigin || new URL(origin).origin !== allowedOrigin) {
          return respond(
            { code: "cross_origin_request" },
            403,
            "rejected",
            "cross_origin_request",
            0,
            "portal_bff",
          );
        }
      } catch {
        return respond(
          { code: "cross_origin_request" },
          403,
          "rejected",
          "cross_origin_request",
          0,
          "portal_bff",
        );
      }
    }

    const contentType = request.headers.get("content-type")?.split(";", 1)[0]?.trim().toLowerCase();
    if (contentType !== "application/json") {
      return respond(
        { code: "invalid_request" },
        415,
        "rejected",
        "unsupported_media_type",
        0,
        "portal_bff",
      );
    }

    const declaredLength = request.headers.get("content-length");
    if (
      declaredLength !== null &&
      /^\d+$/u.test(declaredLength) &&
      Number(declaredLength) > maximumBodyBytes
    ) {
      return respond(
        { code: "body_too_large" },
        413,
        "rejected",
        "body_too_large",
        0,
        "portal_bff",
      );
    }

    let rawBody: Uint8Array;
    try {
      rawBody = await readBoundedBody(request);
    } catch (error) {
      if (error instanceof PortalBodyTooLargeError) {
        return respond(
          { code: "body_too_large" },
          413,
          "rejected",
          "body_too_large",
          0,
          "portal_bff",
        );
      }
      return respond(
        { code: "invalid_request" },
        400,
        "rejected",
        "invalid_request",
        0,
        "portal_bff",
      );
    }
    if (rawBody.byteLength === 0) {
      return respond(
        { code: "invalid_request" },
        400,
        "rejected",
        "invalid_request",
        0,
        "portal_bff",
      );
    }
    if (rawBody.byteLength > maximumBodyBytes) {
      return respond(
        { code: "body_too_large" },
        413,
        "rejected",
        "body_too_large",
        0,
        "portal_bff",
      );
    }

    try {
      const result = await query(rawBody, { correlationId });
      if (result.status === "available") {
        return respond(
          responseBody(result),
          200,
          "ok",
          null,
          result.data.rows.length,
          "portal_edge_lcia",
        );
      }
      if (result.status === "unavailable") {
        return respond(responseBody(result), 200, "unavailable", null, 0, "portal_edge_lcia");
      }
      return respond(
        responseBody(result),
        503,
        "temporarily_unavailable",
        "lcia_temporarily_unavailable",
        null,
        "portal_edge_lcia",
      );
    } catch (error) {
      if (error instanceof PortalLciaInputError) {
        return respond(
          { code: "invalid_request" },
          400,
          "rejected",
          "invalid_request",
          0,
          "portal_bff",
        );
      }
      return respond(
        { code: "lcia_temporarily_unavailable" },
        503,
        "error",
        "lcia_temporarily_unavailable",
        null,
        "portal_edge_lcia",
      );
    }
  };
}

const defaultPostHandler = createPortalLciaPostHandler();

export async function POST(request: Request) {
  return defaultPostHandler(request);
}
