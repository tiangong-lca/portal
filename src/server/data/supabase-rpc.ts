import "server-only";

import type { ZodType } from "zod";

import { readPortalDataEnvironment, type PortalDataEnvironment } from "@/server/data/environment";

const maximumResponseBytes = 512 * 1024;
const rpcNames = new Set([
  "portal_search_processes_v1",
  "portal_search_flows_v1",
  "portal_get_dataset_v1",
  "portal_list_versions_v1",
  "portal_list_process_exchanges_v1",
  "portal_facets_v1",
  "portal_sitemap_entries_v1",
]);

export type PortalRpcName =
  | "portal_search_processes_v1"
  | "portal_search_flows_v1"
  | "portal_get_dataset_v1"
  | "portal_list_versions_v1"
  | "portal_list_process_exchanges_v1"
  | "portal_facets_v1"
  | "portal_sitemap_entries_v1";

export type PortalFetchCachePolicy =
  { mode: "no-store" } | { mode: "revalidate"; seconds: number; tags: string[] };

export type PortalDataErrorCode = "invalid_request" | "upstream_unavailable" | "invalid_response";

export class PortalDataError extends Error {
  readonly code: PortalDataErrorCode;

  constructor(code: PortalDataErrorCode) {
    super(
      code === "invalid_request"
        ? "The Portal request is invalid."
        : "The public data service is temporarily unavailable.",
    );
    this.name = "PortalDataError";
    this.code = code;
  }
}

type NextFetchInit = RequestInit & {
  next?: {
    revalidate?: number;
    tags?: string[];
  };
};

export type PortalRpcClient = {
  call<T>(
    name: PortalRpcName,
    arguments_: Record<string, unknown>,
    responseSchema: ZodType<T>,
    cachePolicy: PortalFetchCachePolicy,
  ): Promise<T>;
};

type PortalRpcClientOptions = {
  environment?: PortalDataEnvironment;
  fetchImplementation?: typeof fetch;
};

function cacheInit(policy: PortalFetchCachePolicy): Pick<NextFetchInit, "cache" | "next"> {
  if (policy.mode === "no-store") {
    return { cache: "no-store" };
  }

  return {
    cache: "force-cache",
    next: {
      revalidate: policy.seconds,
      tags: policy.tags,
    },
  };
}

async function parseBoundedJson(response: Response): Promise<unknown> {
  const contentLength = response.headers.get("content-length");
  if (
    contentLength !== null &&
    /^\d+$/u.test(contentLength) &&
    Number(contentLength) > maximumResponseBytes
  ) {
    throw new PortalDataError("invalid_response");
  }

  const bytes = await response.arrayBuffer();
  if (bytes.byteLength > maximumResponseBytes) {
    throw new PortalDataError("invalid_response");
  }

  try {
    return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes)) as unknown;
  } catch {
    throw new PortalDataError("invalid_response");
  }
}

export function createPortalRpcClient(options: PortalRpcClientOptions = {}): PortalRpcClient {
  const environment = options.environment ?? readPortalDataEnvironment();
  const fetchImplementation = options.fetchImplementation ?? fetch;

  return {
    async call<T>(
      name: PortalRpcName,
      arguments_: Record<string, unknown>,
      responseSchema: ZodType<T>,
      cachePolicy: PortalFetchCachePolicy,
    ): Promise<T> {
      if (!rpcNames.has(name)) {
        throw new PortalDataError("invalid_request");
      }

      const target = new URL(`/rest/v1/rpc/${name}`, environment.supabaseUrl);
      const init: NextFetchInit = {
        method: "POST",
        body: JSON.stringify(arguments_),
        headers: {
          accept: "application/json",
          "accept-profile": "api",
          apikey: environment.publishableKey,
          "content-profile": "api",
          "content-type": "application/json",
        },
        redirect: "error",
        signal: AbortSignal.timeout(environment.timeoutMilliseconds),
        ...cacheInit(cachePolicy),
      };

      let response: Response;
      try {
        response = await fetchImplementation(target, init);
      } catch (error) {
        if (error instanceof PortalDataError) {
          throw error;
        }
        throw new PortalDataError("upstream_unavailable");
      }

      if (!response.ok) {
        throw new PortalDataError(
          response.status === 400 ? "invalid_request" : "upstream_unavailable",
        );
      }

      let payload: unknown;
      try {
        payload = await parseBoundedJson(response);
      } catch (error) {
        if (error instanceof PortalDataError) {
          throw error;
        }
        throw new PortalDataError("invalid_response");
      }

      const parsed = responseSchema.safeParse(payload);
      if (!parsed.success) {
        throw new PortalDataError("invalid_response");
      }

      return parsed.data;
    },
  };
}
