import "server-only";

import type { z } from "zod";

import {
  catalogSearchInputSchema,
  datasetReferenceInputSchema,
  exchangeListInputSchema,
  facetInputSchema,
  sitemapInputSchema,
  versionListInputSchema,
} from "@/server/contracts/input";
import {
  publicDatasetEnvelopeSchema,
  publicExchangePageSchema,
  publicFacetsSchema,
  publicSearchPageSchema,
  publicSitemapPageSchema,
  publicVersionPageSchema,
  type PublicDatasetEnvelope,
  type PublicExchangePage,
  type PublicFacets,
  type PublicSearchPage,
  type PublicSitemapPage,
  type PublicVersionPage,
} from "@/server/contracts/portal";
import {
  createPortalRpcClient,
  PortalDataError,
  type PortalRpcClient,
} from "@/server/data/supabase-rpc";

type CatalogSearchInput = z.input<typeof catalogSearchInputSchema>;
type DatasetReferenceInput = z.input<typeof datasetReferenceInputSchema>;
type VersionListInput = z.input<typeof versionListInputSchema>;
type ExchangeListInput = z.input<typeof exchangeListInputSchema>;
type FacetInput = z.input<typeof facetInputSchema>;
type SitemapInput = z.input<typeof sitemapInputSchema>;

function parseInput<T>(schema: z.ZodType<T>, input: unknown): T {
  const result = schema.safeParse(input);
  if (!result.success) {
    throw new PortalDataError("invalid_request");
  }
  return result.data;
}

function clientOrDefault(client?: PortalRpcClient): PortalRpcClient {
  return client ?? createPortalRpcClient();
}

async function searchPublicCatalog(
  kind: "process" | "flow",
  input: Omit<CatalogSearchInput, "kind">,
  client?: PortalRpcClient,
): Promise<PublicSearchPage> {
  const parsed = parseInput(catalogSearchInputSchema, { ...input, kind });

  return clientOrDefault(client).call(
    kind === "process" ? "portal_search_processes_v1" : "portal_search_flows_v1",
    {
      p_query: parsed.query,
      p_filters: parsed.filters,
      p_sort: parsed.sort,
      p_cursor: parsed.cursor,
      p_limit: parsed.limit,
    },
    publicSearchPageSchema,
    { mode: "no-store" },
  );
}

export function searchPublicProcesses(
  input: Omit<CatalogSearchInput, "kind">,
  client?: PortalRpcClient,
): Promise<PublicSearchPage> {
  return searchPublicCatalog("process", input, client);
}

export function searchPublicFlows(
  input: Omit<CatalogSearchInput, "kind">,
  client?: PortalRpcClient,
): Promise<PublicSearchPage> {
  return searchPublicCatalog("flow", input, client);
}

export async function getPublicDataset(
  input: DatasetReferenceInput,
  client?: PortalRpcClient,
): Promise<PublicDatasetEnvelope | null> {
  const parsed = parseInput(datasetReferenceInputSchema, input);

  return clientOrDefault(client).call(
    "portal_get_dataset_v1",
    {
      p_kind: parsed.kind,
      p_id: parsed.id,
      p_version: parsed.version,
    },
    publicDatasetEnvelopeSchema.nullable(),
    {
      mode: "revalidate",
      seconds: 60,
      tags: [
        `portal:visibility:${parsed.kind}:${parsed.id}:${parsed.version}`,
        `portal:dataset:${parsed.kind}:${parsed.id}:${parsed.version}`,
      ],
    },
  );
}

export async function listPublicDatasetVersions(
  input: VersionListInput,
  client?: PortalRpcClient,
): Promise<PublicVersionPage> {
  const parsed = parseInput(versionListInputSchema, input);

  return clientOrDefault(client).call(
    "portal_list_versions_v1",
    {
      p_kind: parsed.kind,
      p_id: parsed.id,
      p_cursor: parsed.cursor,
      p_limit: parsed.limit,
    },
    publicVersionPageSchema,
    {
      mode: "revalidate",
      seconds: 300,
      tags: [`portal:versions:${parsed.kind}:${parsed.id}`],
    },
  );
}

export async function listPublicProcessExchanges(
  input: ExchangeListInput,
  client?: PortalRpcClient,
): Promise<PublicExchangePage | null> {
  const parsed = parseInput(exchangeListInputSchema, input);

  return clientOrDefault(client).call(
    "portal_list_process_exchanges_v1",
    {
      p_process_id: parsed.processId,
      p_process_version: parsed.processVersion,
      p_exchange_kind: parsed.exchangeKind,
      p_cursor: parsed.cursor,
      p_limit: parsed.limit,
    },
    publicExchangePageSchema.nullable(),
    {
      mode: "revalidate",
      seconds: 300,
      tags: [`portal:exchanges:${parsed.processId}:${parsed.processVersion}`],
    },
  );
}

export async function getPublicFacets(
  input: FacetInput,
  client?: PortalRpcClient,
): Promise<PublicFacets> {
  const parsed = parseInput(facetInputSchema, input);

  return clientOrDefault(client).call(
    "portal_facets_v1",
    {
      p_kind: parsed.kind,
      p_query: parsed.query,
      p_filters: parsed.filters,
    },
    publicFacetsSchema,
    { mode: "no-store" },
  );
}

export async function listPublicSitemapEntries(
  input: SitemapInput = {},
  client?: PortalRpcClient,
): Promise<PublicSitemapPage> {
  const parsed = parseInput(sitemapInputSchema, input);

  return clientOrDefault(client).call(
    "portal_sitemap_entries_v1",
    {
      p_kind: parsed.kind,
      p_cursor: parsed.cursor,
      p_limit: parsed.limit,
    },
    publicSitemapPageSchema,
    {
      mode: "revalidate",
      seconds: 300,
      tags: [`portal:sitemap:${parsed.kind}`],
    },
  );
}
