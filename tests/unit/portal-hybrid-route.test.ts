import { afterEach, describe, expect, it, vi } from "vitest";

import catalogFixture from "../fixtures/portal/catalog-v1.json";

import type { PortalHybridSearchRequest } from "@/lib/hybrid-request";
import { createPortalHybridPostHandler } from "@/app/internal/hybrid/route";
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
