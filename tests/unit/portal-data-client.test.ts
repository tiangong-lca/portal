import { describe, expect, it, vi } from "vitest";

import fixture from "../fixtures/portal/catalog-v1.json";

import {
  publicDatasetEnvelopeSchema,
  publicSearchPageSchema,
  publicSitemapShardSchema,
} from "@/server/contracts/portal";
import {
  getPublicDataset,
  getPublicFacets,
  getPublicSitemapManifest,
  getPublicSitemapShard,
  listPublicDatasetVersions,
  listPublicProcessExchanges,
  listPublicSitemapEntries,
  searchPublicProcesses,
} from "@/server/data/catalog";
import { readPortalDataEnvironment } from "@/server/data/environment";
import {
  createPortalRpcClient,
  PortalDataError,
  type PortalRpcClient,
} from "@/server/data/supabase-rpc";
import type { PortalTelemetryLogger } from "@/server/telemetry/logger";

const environment = {
  supabaseUrl: "https://project.supabase.co",
  publishableKey: "sb_publishable_abcdefghijklmnopqrstuvwxyz",
  timeoutMilliseconds: 1000,
};

function clientReturning(response: unknown): PortalRpcClient {
  return {
    async call<T>(): Promise<T> {
      return response as T;
    },
  };
}

function sitemapItems(count: number) {
  return Array.from({ length: count }, (_, index) => ({
    key: {
      kind: "process" as const,
      id: `00000000-0000-4000-8000-${(index + 1).toString(16).padStart(12, "0")}`,
      version: "01.00.000",
    },
    modifiedAt: "2026-08-25T12:00:00Z",
  }));
}

describe("Portal Supabase public RPC client", () => {
  it("uses the explicit api profile and only a publishable API key", async () => {
    const fetchImplementation = vi.fn<typeof fetch>(async (..._arguments) =>
      Response.json(fixture.search),
    );
    const client = createPortalRpcClient({ environment, fetchImplementation });

    await client.call(
      "portal_search_processes_v1",
      { p_query: "electricity", p_filters: {}, p_sort: "relevance", p_cursor: null, p_limit: 20 },
      publicSearchPageSchema,
      { mode: "no-store" },
    );

    const [target, init] = fetchImplementation.mock.calls[0]!;
    const headers = new Headers(init?.headers);
    expect(target instanceof URL ? target.href : new Request(target).url).toBe(
      "https://project.supabase.co/rest/v1/rpc/portal_search_processes_v1",
    );
    expect(headers.get("apikey")).toBe(environment.publishableKey);
    expect(headers.get("accept-profile")).toBe("api");
    expect(headers.get("content-profile")).toBe("api");
    expect(headers.has("authorization")).toBe(false);
    expect(headers.has("cookie")).toBe(false);
    expect(init?.cache).toBe("no-store");
  });

  it("applies bounded Next cache lifetimes and tags to cacheable public reads", async () => {
    const fetchImplementation = vi.fn<typeof fetch>(async () =>
      Response.json(fixture.datasetProcess),
    );
    const client = createPortalRpcClient({ environment, fetchImplementation });

    await client.call(
      "portal_get_dataset_v1",
      {
        p_kind: "process",
        p_id: fixture.datasetProcess.key.id,
        p_version: fixture.datasetProcess.key.version,
      },
      publicDatasetEnvelopeSchema,
      { mode: "revalidate", seconds: 60, tags: ["portal:visibility:test"] },
    );

    const init = fetchImplementation.mock.calls[0]?.[1] as
      (RequestInit & { next?: { revalidate?: number; tags?: string[] } }) | undefined;
    expect(init?.cache).toBe("force-cache");
    expect(init?.next).toEqual({ revalidate: 60, tags: ["portal:visibility:test"] });
  });

  it("accepts a valid sitemap shard above the legacy limit but rejects responses above 2 MiB", async () => {
    const manifestLogger = vi.fn<PortalTelemetryLogger>();
    const manifestClient = createPortalRpcClient({
      environment,
      fetchImplementation: vi.fn<typeof fetch>(async () => Response.json(fixture.sitemapManifest)),
      logger: manifestLogger,
    });
    await expect(getPublicSitemapManifest(manifestClient)).resolves.toEqual(
      fixture.sitemapManifest,
    );
    expect(manifestLogger).toHaveBeenCalledWith(
      expect.objectContaining({
        rpcName: "portal_sitemap_manifest_v1",
        rowCount: 64,
      }),
    );

    const payload = { ...fixture.sitemapShard, items: sitemapItems(4096) };
    const serialized = JSON.stringify(payload);
    const serializedBytes = new TextEncoder().encode(serialized).byteLength;
    expect(serializedBytes).toBeGreaterThan(512 * 1024);
    expect(serializedBytes).toBeLessThan(2 * 1024 * 1024);

    const logger = vi.fn<PortalTelemetryLogger>();
    const client = createPortalRpcClient({
      environment,
      fetchImplementation: vi.fn<typeof fetch>(
        async () => new Response(serialized, { headers: { "content-type": "application/json" } }),
      ),
      logger,
    });
    const shard = await getPublicSitemapShard(
      { shardCursor: fixture.sitemapShard.shardCursor },
      client,
    );
    expect(shard.items).toHaveLength(4096);
    expect(logger).toHaveBeenCalledWith(
      expect.objectContaining({
        routeFamily: "sitemap",
        rpcName: "portal_sitemap_shard_v1",
        rowCount: 4096,
      }),
    );

    const oversizedClient = createPortalRpcClient({
      environment,
      fetchImplementation: vi.fn<typeof fetch>(
        async () => new Response("x".repeat(2 * 1024 * 1024 + 1)),
      ),
      logger: vi.fn<PortalTelemetryLogger>(),
    });
    await expect(
      oversizedClient.call(
        "portal_sitemap_shard_v1",
        { p_shard_cursor: fixture.sitemapShard.shardCursor },
        publicSitemapShardSchema,
        { mode: "no-store" },
      ),
    ).rejects.toMatchObject({ code: "invalid_response" });
  });

  it("keeps catalog RPC parameters allowlisted", async () => {
    const calls: unknown[][] = [];
    const client: PortalRpcClient = {
      async call<T>(...arguments_: Parameters<PortalRpcClient["call"]>): Promise<T> {
        calls.push(arguments_);
        return fixture.search as T;
      },
    };

    await searchPublicProcesses(
      {
        query: "electricity",
        filters: { geography: "CN" },
        sort: "relevance",
        cursor: null,
        limit: 20,
      },
      client,
    );

    expect(calls[0]).toEqual([
      "portal_search_processes_v1",
      {
        p_query: "electricity",
        p_filters: { geography: "cn" },
        p_sort: "relevance",
        p_cursor: null,
        p_limit: 20,
      },
      expect.anything(),
      { mode: "no-store" },
    ]);
  });

  it("fails closed when a valid DTO is bound to a different public request", async () => {
    const processReference = {
      kind: "process" as const,
      id: fixture.datasetProcess.key.id,
      version: fixture.datasetProcess.key.version,
    };
    const otherId = fixture.datasetFlow.key.id;

    await expect(
      searchPublicProcesses(
        { query: "electricity" },
        clientReturning({ ...fixture.search, kind: "flow" }),
      ),
    ).rejects.toMatchObject({ code: "invalid_response" });
    await expect(
      searchPublicProcesses(
        { query: "electricity" },
        clientReturning({
          ...fixture.search,
          items: [
            {
              ...fixture.search.items[0],
              key: { ...fixture.search.items[0]!.key, kind: "flow" },
            },
          ],
        }),
      ),
    ).rejects.toMatchObject({ code: "invalid_response" });

    await expect(
      getPublicDataset(
        processReference,
        clientReturning({
          ...fixture.datasetProcess,
          key: { ...fixture.datasetProcess.key, id: otherId },
        }),
      ),
    ).rejects.toMatchObject({ code: "invalid_response" });

    await expect(
      listPublicDatasetVersions(
        { kind: "process", id: processReference.id },
        clientReturning({
          ...fixture.versions,
          dataset: { ...fixture.versions.dataset, id: otherId },
        }),
      ),
    ).rejects.toMatchObject({ code: "invalid_response" });
    await expect(
      listPublicDatasetVersions(
        { kind: "process", id: processReference.id },
        clientReturning({
          ...fixture.versions,
          items: [
            {
              ...fixture.versions.items[0],
              key: { ...fixture.versions.items[0]!.key, id: otherId },
            },
          ],
        }),
      ),
    ).rejects.toMatchObject({ code: "invalid_response" });

    await expect(
      listPublicProcessExchanges(
        { processId: processReference.id, processVersion: processReference.version },
        clientReturning({
          ...fixture.exchanges,
          process: { ...fixture.exchanges.process, id: otherId },
        }),
      ),
    ).rejects.toMatchObject({ code: "invalid_response" });

    await expect(
      getPublicFacets(
        { kind: "process", query: "electricity" },
        clientReturning({ ...fixture.facets, kind: "flow" }),
      ),
    ).rejects.toMatchObject({ code: "invalid_response" });

    await expect(
      listPublicSitemapEntries(
        { kind: "process" },
        clientReturning({
          ...fixture.sitemap,
          items: [
            {
              ...fixture.sitemap.items[0],
              key: { ...fixture.sitemap.items[0]!.key, kind: "flow" },
            },
          ],
        }),
      ),
    ).rejects.toMatchObject({ code: "invalid_response" });

    await expect(
      getPublicSitemapShard(
        { shardCursor: fixture.sitemapShard.shardCursor },
        clientReturning({ ...fixture.sitemapShard, shardCursor: "portal-sitemap-v1-01" }),
      ),
    ).rejects.toMatchObject({ code: "invalid_response" });
    await expect(
      getPublicSitemapShard(
        { shardCursor: "cursor with spaces" },
        clientReturning(fixture.sitemapShard),
      ),
    ).rejects.toMatchObject({ code: "invalid_request" });
  });

  it("binds every catalog adapter to the versioned RPC and intended cache policy", async () => {
    const calls: Array<{
      name: string;
      arguments_: Record<string, unknown>;
      policy: unknown;
    }> = [];
    const responseByName: Record<string, unknown> = {
      portal_get_dataset_v1: fixture.datasetProcess,
      portal_list_versions_v1: fixture.versions,
      portal_list_process_exchanges_v1: fixture.exchanges,
      portal_facets_v1: fixture.facets,
      portal_sitemap_entries_v1: fixture.sitemap,
      portal_sitemap_manifest_v1: fixture.sitemapManifest,
      portal_sitemap_shard_v1: fixture.sitemapShard,
    };
    const client: PortalRpcClient = {
      async call<T>(...callArguments: Parameters<PortalRpcClient["call"]>): Promise<T> {
        const [name, arguments_, _responseSchema, policy] = callArguments;
        calls.push({ name, arguments_, policy });
        return responseByName[name] as T;
      },
    };
    const reference = {
      kind: "process" as const,
      id: fixture.datasetProcess.key.id,
      version: fixture.datasetProcess.key.version,
    };

    await getPublicDataset(reference, client);
    await listPublicDatasetVersions({ kind: reference.kind, id: reference.id }, client);
    await listPublicProcessExchanges(
      { processId: reference.id, processVersion: reference.version },
      client,
    );
    await getPublicFacets({ kind: "all", query: "electricity" }, client);
    await listPublicSitemapEntries({}, client);
    const manifest = await getPublicSitemapManifest(client);
    await getPublicSitemapShard({ shardCursor: manifest.shards[0]!.shardCursor }, client);

    expect(calls.map(({ name }) => name)).toEqual([
      "portal_get_dataset_v1",
      "portal_list_versions_v1",
      "portal_list_process_exchanges_v1",
      "portal_facets_v1",
      "portal_sitemap_entries_v1",
      "portal_sitemap_manifest_v1",
      "portal_sitemap_shard_v1",
    ]);
    expect(calls.map(({ policy }) => policy)).toEqual([
      expect.objectContaining({ mode: "revalidate", seconds: 60 }),
      expect.objectContaining({ mode: "revalidate", seconds: 300 }),
      expect.objectContaining({ mode: "revalidate", seconds: 300 }),
      { mode: "no-store" },
      expect.objectContaining({ mode: "revalidate", seconds: 300 }),
      { mode: "no-store" },
      { mode: "no-store" },
    ]);
    expect(calls[0]?.arguments_).toEqual({
      p_kind: "process",
      p_id: reference.id,
      p_version: reference.version,
    });
    expect(calls.at(-2)?.arguments_).toEqual({});
    expect(calls.at(-1)?.arguments_).toEqual({
      p_shard_cursor: fixture.sitemapManifest.shards[0]!.shardCursor,
    });
  });

  it("collapses polluted upstream payloads into a generic contract error", async () => {
    const fetchImplementation = vi.fn<typeof fetch>(async (..._arguments) =>
      Response.json({ ...fixture.search, serviceLocator: "private://database" }),
    );
    const client = createPortalRpcClient({ environment, fetchImplementation });

    await expect(
      client.call(
        "portal_search_processes_v1",
        { p_query: "electricity" },
        publicSearchPageSchema,
        { mode: "no-store" },
      ),
    ).rejects.toMatchObject({ code: "invalid_response" });
    await expect(
      client.call(
        "portal_search_processes_v1",
        { p_query: "electricity" },
        publicSearchPageSchema,
        { mode: "no-store" },
      ),
    ).rejects.toBeInstanceOf(PortalDataError);
  });

  it("rejects secret and service-role credentials in the publishable-key slot", () => {
    expect(() =>
      readPortalDataEnvironment({
        SUPABASE_URL: environment.supabaseUrl,
        SUPABASE_PUBLISHABLE_KEY: "sb_secret_abcdefghijklmnopqrstuvwxyz",
      }),
    ).toThrow("secret keys are forbidden");

    const serviceRolePayload = btoa(JSON.stringify({ role: "service_role" }))
      .replaceAll("+", "-")
      .replaceAll("/", "_")
      .replace(/=+$/u, "");
    expect(() =>
      readPortalDataEnvironment({
        SUPABASE_URL: environment.supabaseUrl,
        SUPABASE_PUBLISHABLE_KEY: `header.${serviceRolePayload}.signature`,
      }),
    ).toThrow("service-role keys are forbidden");
  });
});
