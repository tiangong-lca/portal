import { describe, expect, it, vi } from "vitest";

import fixture from "../fixtures/portal/catalog-v1.json";

import { publicDatasetEnvelopeSchema, publicSearchPageSchema } from "@/server/contracts/portal";
import {
  getPublicFacets,
  getPublicDataset,
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

const environment = {
  supabaseUrl: "https://project.supabase.co",
  publishableKey: "sb_publishable_abcdefghijklmnopqrstuvwxyz",
  timeoutMilliseconds: 1000,
};

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
      publicSearchPageSchema,
      { mode: "no-store" },
    ]);
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

    expect(calls.map(({ name }) => name)).toEqual([
      "portal_get_dataset_v1",
      "portal_list_versions_v1",
      "portal_list_process_exchanges_v1",
      "portal_facets_v1",
      "portal_sitemap_entries_v1",
    ]);
    expect(calls.map(({ policy }) => policy)).toEqual([
      expect.objectContaining({ mode: "revalidate", seconds: 60 }),
      expect.objectContaining({ mode: "revalidate", seconds: 300 }),
      expect.objectContaining({ mode: "revalidate", seconds: 300 }),
      { mode: "no-store" },
      expect.objectContaining({ mode: "revalidate", seconds: 300 }),
    ]);
    expect(calls[0]?.arguments_).toEqual({
      p_kind: "process",
      p_id: reference.id,
      p_version: reference.version,
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
