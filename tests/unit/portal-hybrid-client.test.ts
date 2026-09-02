import { describe, expect, it, vi } from "vitest";

import catalogFixture from "../fixtures/portal/catalog-v1.json";
import environmentFixture from "../fixtures/portal/r1-environments.json";

import type { PortalHybridSearchRequest } from "@/lib/hybrid-request";
import {
  portalHybridFunctionPath,
  PortalHybridInputError,
  queryPortalHybrid,
  queryPortalHybridRaw,
} from "@/server/hybrid/client";
import {
  portalHybridEdgeTimeoutMilliseconds,
  readPortalHybridEnvironment,
} from "@/server/hybrid/environment";
import { readPortalLciaEnvironment } from "@/server/lcia/environment";

const request: PortalHybridSearchRequest = {
  schemaVersion: "portal.hybrid-search-request.v1",
  kind: "process",
  query: "low-carbon steel",
  filters: {},
  limit: 10,
};

const environment = {
  supabaseUrl: "https://project.supabase.co",
  publishableKey: environmentFixture.preview.publishableKey,
  timeoutMilliseconds: 2000,
  edgeOrigin: "https://project.supabase.co",
  keyId: environmentFixture.preview.keyId,
  secret: environmentFixture.preview.hmacSecret,
  edgeTimeoutMilliseconds: 2000,
};

function edgePage() {
  return {
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
        kind: "hybrid",
        algorithmVersion: "portal-hybrid-rank-v1",
        score: index === 0 ? 0.9 : 0.8,
        reasonCodes: ["lexical_public_projection", "semantic_public_projection"],
        evidence: {
          lexicalRank: index + 1,
          semanticRank: index + 1,
          semanticDistance: index === 0 ? "0.125" : "0.25",
        },
      },
    })),
  };
}

describe("Portal Hybrid signed client", () => {
  it("uses a dedicated bounded Hybrid timeout without widening LCIA", () => {
    const runtimeEnvironment = {
      SUPABASE_URL: environment.supabaseUrl,
      SUPABASE_PUBLISHABLE_KEY: environment.publishableKey,
      PORTAL_EDGE_ENDPOINT: environment.edgeOrigin,
      PORTAL_EDGE_KEY_ID: environment.keyId,
      PORTAL_EDGE_HMAC_SECRET: environment.secret,
      PORTAL_EDGE_TIMEOUT_MS: "8000",
    };

    expect(readPortalHybridEnvironment(runtimeEnvironment).edgeTimeoutMilliseconds).toBe(
      portalHybridEdgeTimeoutMilliseconds,
    );
    expect(readPortalLciaEnvironment(runtimeEnvironment).edgeTimeoutMilliseconds).toBe(8000);
    expect(
      readPortalHybridEnvironment({
        ...runtimeEnvironment,
        PORTAL_HYBRID_EDGE_TIMEOUT_MS: "25000",
      }).edgeTimeoutMilliseconds,
    ).toBe(25000);
    expect(() =>
      readPortalHybridEnvironment({
        ...runtimeEnvironment,
        PORTAL_HYBRID_EDGE_TIMEOUT_MS: "30001",
      }),
    ).toThrow("Portal Hybrid Edge timeout must not exceed 30000 ms");
  });

  it("signs the exact raw body for the fixed Hybrid path and validates success", async () => {
    const fetchImplementation = vi.fn<typeof fetch>(async (input, init) => {
      expect(input).toBeInstanceOf(URL);
      expect((input as URL).toString()).toBe(
        `https://project.supabase.co${portalHybridFunctionPath}`,
      );
      expect(init?.method).toBe("POST");
      expect(new TextDecoder().decode(init?.body as ArrayBuffer)).toBe(JSON.stringify(request));
      const headers = new Headers(init?.headers);
      expect(headers.get("apikey")).toBe(environment.publishableKey);
      expect(headers.get("x-portal-key-id")).toBe(environment.keyId);
      expect(headers.get("x-portal-signature")).toMatch(/^[A-Za-z0-9_-]{43}$/u);
      expect(headers.get("x-portal-correlation-id")).toBe("aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa");
      return Response.json(edgePage());
    });

    await expect(
      queryPortalHybrid(request, {
        environment,
        fetchImplementation,
        now: () => 1_800_000_000_000,
        nonce: () => "AAAAAAAAAAAAAAAAAAAAAA",
        correlationId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      }),
    ).resolves.toMatchObject({ status: "available", data: { items: [{ context: {} }] } });
    expect(fetchImplementation).toHaveBeenCalledTimes(1);
  });

  it("maps fixed Edge failures without forwarding private messages", async () => {
    for (const code of [
      "hybrid_disabled",
      "guard_unavailable",
      "budget_exhausted",
      "concurrency_exhausted",
      "circuit_open",
      "hybrid_timeout",
    ] as const) {
      const result = await queryPortalHybrid(request, {
        environment,
        fetchImplementation: vi.fn<typeof fetch>(async () =>
          Response.json({ code, message: "private provider and locator details" }, { status: 503 }),
        ),
      });
      expect(result).toEqual({ status: "fallback", reason: code });
      expect(JSON.stringify(result)).not.toContain("private provider");
    }
  });

  it("fails malformed or context-drifted success responses to lexical fallback", async () => {
    const malformed = edgePage();
    delete (malformed.items[0] as Partial<(typeof malformed.items)[number]>).context;
    await expect(
      queryPortalHybrid(request, {
        environment,
        fetchImplementation: vi.fn<typeof fetch>(async () => Response.json(malformed)),
      }),
    ).resolves.toEqual({ status: "fallback", reason: "contract_failure" });
  });

  it("rejects client-shaped extra fields before signing or fetch", async () => {
    const fetchImplementation = vi.fn<typeof fetch>();
    await expect(
      queryPortalHybridRaw(
        new TextEncoder().encode(JSON.stringify({ ...request, embedding: [0.1] })),
        { environment, fetchImplementation },
      ),
    ).rejects.toBeInstanceOf(PortalHybridInputError);
    expect(fetchImplementation).not.toHaveBeenCalled();
  });

  it("falls back when server-only Edge configuration is absent", async () => {
    await expect(
      queryPortalHybrid(request, {
        fetchImplementation: vi.fn<typeof fetch>(),
      }),
    ).resolves.toEqual({ status: "fallback", reason: "hybrid_upstream_unavailable" });
  });
});
