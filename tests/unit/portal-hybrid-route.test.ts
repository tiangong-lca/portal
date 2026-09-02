import { afterEach, describe, expect, it, vi } from "vitest";

import catalogFixture from "../fixtures/portal/catalog-v1.json";
import { hybridVersionPage } from "../fixtures/portal/hybrid-v2";

import type { PortalHybridSearchRequest } from "@/lib/hybrid-request";
import { createPortalHybridPostHandler } from "@/server/hybrid/handler";
import type { PublicSearchPage } from "@/server/contracts/portal";
import { PortalDataError } from "@/server/data/supabase-rpc";
import { queryPortalHybridRaw, type PortalHybridQueryResult } from "@/server/hybrid/client";
import { portalHybridSearchPageSchema } from "@/server/hybrid/contracts";
import type { PortalTelemetryEvent, PortalTelemetryLogger } from "@/server/telemetry/logger";

const input: PortalHybridSearchRequest = {
  schemaVersion: "portal.hybrid-search-request.v1",
  kind: "process",
  query: "private natural-language query",
  filters: {},
  limit: 10,
};

function edgeSuccess(): PortalHybridQueryResult {
  return {
    status: "available",
    data: portalHybridSearchPageSchema.parse({
      schemaVersion: "portal.hybrid-search-page.v1",
      kind: "process",
      queryFingerprint: "a".repeat(64),
      interpretation: {
        source: "model_generated",
        advisory: true,
        semanticQuery: "low carbon steel production",
        terms: [{ language: "en", value: "steel production" }],
      },
      items: catalogFixture.search.items.map((item, index) => ({
        ...item,
        match: {
          kind: "hybrid" as const,
          algorithmVersion: "portal-hybrid-rank-v1" as const,
          score: index === 0 ? 0.9 : 0.8,
          reasonCodes: [
            "lexical_public_projection" as const,
            "semantic_public_projection" as const,
          ],
          evidence: {
            lexicalRank: index + 1,
            semanticRank: index + 1,
            semanticDistance: index === 0 ? "0.125" : "0.25",
          },
        },
      })),
    }),
  };
}

function request(body: unknown = input, headers: Record<string, string> = {}) {
  return new Request("http://portal.test/internal/hybrid", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json", ...headers },
  });
}

function sequence(...values: number[]) {
  let index = 0;
  return () => values[Math.min(index++, values.length - 1)]!;
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("Portal Hybrid same-origin BFF", () => {
  it("does not start lexical fallback after the user cancelled the incoming request", async () => {
    const controller = new AbortController();
    const lexicalFallback =
      vi.fn<(input: PortalHybridSearchRequest) => Promise<PublicSearchPage>>();
    const handler = createPortalHybridPostHandler({
      query: vi.fn<typeof queryPortalHybridRaw>(async (_body, options) => {
        expect(options?.signal).toBeInstanceOf(AbortSignal);
        controller.abort();
        return { status: "fallback", reason: "hybrid_upstream_unavailable" };
      }),
      lexicalFallback,
      logger: vi.fn<PortalTelemetryLogger>(),
    });
    const incoming = new Request(request(), { signal: controller.signal });
    expect((await handler(incoming)).status).toBe(499);
    expect(lexicalFallback).not.toHaveBeenCalled();
  });

  const versionInput = {
    ...input,
    schemaVersion: "portal.hybrid-search-request.v2" as const,
    cursor: null as string | null,
  };

  it("returns early lexical results without invoking the signed model path", async () => {
    const query = vi.fn<typeof queryPortalHybridRaw>();
    const lexicalFallback = vi.fn<() => Promise<PublicSearchPage>>(
      async () => catalogFixture.search as PublicSearchPage,
    );
    const handler = createPortalHybridPostHandler({
      lexicalOnly: true,
      query,
      lexicalFallback,
      logger: vi.fn<PortalTelemetryLogger>(),
    });
    const response = await handler(request(versionInput));
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      schemaVersion: "portal.hybrid-bff.v2",
      mode: "lexical",
      interpretation: null,
      fallbackReason: null,
    });
    expect(query).not.toHaveBeenCalled();
    expect(lexicalFallback).toHaveBeenCalledWith(
      expect.objectContaining({ query: input.query, cursor: null }),
    );
  });

  it("preserves exact version groups and continuation in a V2 response", async () => {
    const handler = createPortalHybridPostHandler({
      query: vi.fn<typeof queryPortalHybridRaw>(async () => ({
        status: "available",
        data: portalHybridSearchPageSchema.parse(hybridVersionPage()),
      })),
      logger: vi.fn<PortalTelemetryLogger>(),
    });
    const response = await handler(request(versionInput));
    const payload = await response.json();
    expect(response.status).toBe(200);
    expect(payload).toMatchObject({
      schemaVersion: "portal.hybrid-bff.v2",
      mode: "hybrid",
      datasetCount: 1,
      candidateCount: 2,
      nextCursor: null,
    });
    expect(payload.versionGroups[0].matches).toHaveLength(2);
    expect(JSON.stringify(payload)).not.toContain(input.query);
  });

  it.each(["invalid_request", "hybrid_timeout"] as const)(
    "does not replace a failed cursor with lexical page one (%s)",
    async (reason) => {
      const lexicalFallback =
        vi.fn<(input: PortalHybridSearchRequest) => Promise<PublicSearchPage>>();
      const handler = createPortalHybridPostHandler({
        query: vi.fn<typeof queryPortalHybridRaw>(async () => ({ status: "fallback", reason })),
        lexicalFallback,
        logger: vi.fn<PortalTelemetryLogger>(),
      });
      const response = await handler(request({ ...versionInput, cursor: "opaque_cursor" }));
      expect(response.status).toBe(reason === "invalid_request" ? 409 : 503);
      await expect(response.json()).resolves.toEqual({
        code: reason === "invalid_request" ? "hybrid_cursor_expired" : "hybrid_page_unavailable",
      });
      expect(lexicalFallback).not.toHaveBeenCalled();
    },
  );

  it("applies the same origin and strict request boundary to early lexical search", async () => {
    const lexicalFallback =
      vi.fn<(input: PortalHybridSearchRequest) => Promise<PublicSearchPage>>();
    const handler = createPortalHybridPostHandler({
      lexicalOnly: true,
      lexicalFallback,
      logger: vi.fn<PortalTelemetryLogger>(),
    });
    expect(
      (await handler(request(versionInput, { origin: "https://attacker.example" }))).status,
    ).toBe(403);
    expect((await handler(request({ ...versionInput, state_code: 20 }))).status).toBe(400);
    expect((await handler(request(input))).status).toBe(400);
    expect(lexicalFallback).not.toHaveBeenCalled();
  });

  it("returns strict advisory Hybrid results without echoing the raw query", async () => {
    const events: PortalTelemetryEvent[] = [];
    const handler = createPortalHybridPostHandler({
      query: vi.fn<typeof queryPortalHybridRaw>(async () => edgeSuccess()),
      lexicalFallback: vi.fn<(input: PortalHybridSearchRequest) => Promise<PublicSearchPage>>(),
      logger: (event) => {
        events.push(event);
      },
      correlationId: () => "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      now: sequence(10, 14),
      telemetryEnvironment: { NODE_ENV: "test" },
    });

    const response = await handler(request());
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toMatchObject({
      schemaVersion: "portal.hybrid-bff.v1",
      mode: "hybrid",
      fallbackReason: null,
      interpretation: { source: "model_generated", advisory: true },
      items: [{ context: { reference: {} } }],
    });
    expect(JSON.stringify(body)).not.toContain(input.query);
    expect(events).toEqual([
      expect.objectContaining({
        routeFamily: "hybrid_bff",
        backend: "portal_edge_hybrid",
        status: "ok",
        errorCode: null,
        rowCount: 1,
      }),
    ]);
    expect(JSON.stringify(events)).not.toContain(input.query);
  });

  it("executes lexical fallback for every fixed Edge rejection reason", async () => {
    for (const reason of [
      "hybrid_disabled",
      "guard_unavailable",
      "budget_exhausted",
      "concurrency_exhausted",
      "circuit_open",
      "hybrid_timeout",
      "contract_failure",
    ] as const) {
      const lexicalFallback = vi.fn<
        (input: PortalHybridSearchRequest) => Promise<PublicSearchPage>
      >(async () => catalogFixture.search as PublicSearchPage);
      const handler = createPortalHybridPostHandler({
        query: vi.fn<typeof queryPortalHybridRaw>(async () => ({
          status: "fallback" as const,
          reason,
        })),
        lexicalFallback,
        logger: vi.fn<PortalTelemetryLogger>(),
      });
      const response = await handler(request());
      expect(response.status).toBe(200);
      await expect(response.json()).resolves.toMatchObject({
        mode: "lexical_fallback",
        fallbackReason: reason,
        interpretation: null,
        items: [{ match: { kind: "lexical" } }],
      });
      expect(lexicalFallback).toHaveBeenCalledWith(
        expect.objectContaining({ query: input.query, kind: "process" }),
      );
    }
  });

  it("rejects extra fields before Edge or lexical work", async () => {
    const query = vi.fn<typeof queryPortalHybridRaw>();
    const lexicalFallback =
      vi.fn<(input: PortalHybridSearchRequest) => Promise<PublicSearchPage>>();
    const handler = createPortalHybridPostHandler({
      query,
      lexicalFallback,
      logger: vi.fn<PortalTelemetryLogger>(),
    });
    const response = await handler(request({ ...input, model: "forbidden" }));
    expect(response.status).toBe(400);
    expect(query).not.toHaveBeenCalled();
    expect(lexicalFallback).not.toHaveBeenCalled();
  });

  it("fails closed when both Hybrid and lexical upstreams are unavailable", async () => {
    const handler = createPortalHybridPostHandler({
      query: vi.fn<typeof queryPortalHybridRaw>(async () => ({
        status: "fallback",
        reason: "guard_unavailable",
      })),
      lexicalFallback: vi.fn<(input: PortalHybridSearchRequest) => Promise<PublicSearchPage>>(
        async () => {
          throw new PortalDataError("upstream_unavailable");
        },
      ),
      logger: vi.fn<PortalTelemetryLogger>(),
    });
    const response = await handler(request());
    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({ code: "hybrid_fallback_unavailable" });
  });

  it("rejects cross-origin POST before reading or signing the body", async () => {
    vi.stubEnv("SITE_URL", "https://portal.example");
    const query = vi.fn<typeof queryPortalHybridRaw>();
    const handler = createPortalHybridPostHandler({
      query,
      logger: vi.fn<PortalTelemetryLogger>(),
    });
    const response = await handler(request(input, { origin: "https://attacker.example" }));
    expect(response.status).toBe(403);
    expect(query).not.toHaveBeenCalled();
  });
});
