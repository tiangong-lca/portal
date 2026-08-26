import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { once } from "node:events";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import type { AddressInfo } from "node:net";
import { pathToFileURL } from "node:url";

import catalogFixture from "../tests/fixtures/portal/catalog-v1.json";
import environmentFixture from "../tests/fixtures/portal/r1-environments.json";

export type PortalR1FixtureEnvironmentName = keyof typeof environmentFixture;

type FixtureRequestReceipt = {
  bodyBytes: number;
  bodySha256: string;
  correlationId?: string;
  keyId?: string;
  name?: string;
};

export type PortalR1FixtureReceipts = {
  rpcAccepted: number;
  rpcByName: Record<string, number>;
  lciaAccepted: number;
  rejected: number;
  lastRpc: FixtureRequestReceipt | null;
  lastLcia: FixtureRequestReceipt | null;
};

type StartOptions = {
  environment: PortalR1FixtureEnvironmentName;
  host?: string;
  port?: number;
};

export type PortalR1FixtureServer = {
  environment: PortalR1FixtureEnvironmentName;
  origin: string;
  receipts: PortalR1FixtureReceipts;
  close(): Promise<void>;
};

const maximumRequestBytes = 64 * 1024;
const portalDataProductPath = "/functions/v1/portal_data_product_results_v1";
const secondProcessId = "77777777-7777-7777-7777-777777777777";
const requiredLciaKeys = ["cursor", "impactCategoryId", "limit", "mode", "processRefs"];
const forbiddenRpcKeys = new Set([
  "actor",
  "authorization",
  "service_role",
  "state",
  "state_code",
  "team",
  "team_id",
  "user_id",
]);

function writeJson(response: ServerResponse, status: number, payload: unknown): void {
  const body = Buffer.from(JSON.stringify(payload));
  response.writeHead(status, {
    "cache-control": "no-store",
    "content-length": String(body.byteLength),
    "content-type": "application/json; charset=utf-8",
  });
  response.end(body);
}

async function readRawBody(request: IncomingMessage): Promise<Buffer> {
  const chunks: Buffer[] = [];
  let totalBytes = 0;

  for await (const chunk of request) {
    const bytes = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    totalBytes += bytes.byteLength;
    if (totalBytes > maximumRequestBytes) {
      throw new Error("fixture_body_too_large");
    }
    chunks.push(bytes);
  }

  return Buffer.concat(chunks);
}

function bodyReceipt(rawBody: Buffer): FixtureRequestReceipt {
  return {
    bodyBytes: rawBody.byteLength,
    bodySha256: createHash("sha256").update(rawBody).digest("hex"),
  };
}

function parseJsonObject(rawBody: Buffer): Record<string, unknown> | null {
  try {
    const parsed = JSON.parse(rawBody.toString("utf8")) as unknown;
    return parsed !== null && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

function containsForbiddenKey(value: unknown): boolean {
  if (Array.isArray(value)) {
    return value.some(containsForbiddenKey);
  }
  if (value === null || typeof value !== "object") {
    return false;
  }

  return Object.entries(value).some(
    ([key, nested]) => forbiddenRpcKeys.has(key.toLowerCase()) || containsForbiddenKey(nested),
  );
}

function hasForbiddenCredential(request: IncomingMessage): boolean {
  return request.headers.authorization !== undefined || request.headers.cookie !== undefined;
}

function processSearchResponse() {
  const firstItem = catalogFixture.search.items[0]!;
  return {
    ...catalogFixture.search,
    items: [
      firstItem,
      {
        ...firstItem,
        key: { ...firstItem.key, id: secondProcessId },
        names: [{ language: "en", value: "Electricity, low voltage" }],
        match: { ...firstItem.match, score: 0.8 },
      },
    ],
  };
}

function processDataset(id: string, name: string) {
  return {
    ...catalogFixture.datasetProcess,
    key: { ...catalogFixture.datasetProcess.key, id },
    metadata: {
      ...catalogFixture.datasetProcess.metadata,
      names: [{ language: "en", value: name }],
      cutoffRules: [{ language: "en", value: "Cutoff 1%" }],
    },
  };
}

function secondProcessDataset() {
  return processDataset(secondProcessId, "Electricity, low voltage");
}

function flowSearchResponse() {
  return {
    ...catalogFixture.search,
    kind: "flow",
    items: [
      {
        key: catalogFixture.datasetFlow.key,
        accessLevel: catalogFixture.datasetFlow.accessLevel,
        capabilities: catalogFixture.datasetFlow.capabilities,
        names: catalogFixture.datasetFlow.metadata.names,
        summary: catalogFixture.datasetFlow.metadata.generalComment,
        geography: {
          code: catalogFixture.datasetFlow.metadata.locationOfSupply.code,
          label: catalogFixture.datasetFlow.metadata.locationOfSupply.label,
          precision: "unknown",
        },
        referenceYear: null,
        modifiedAt: catalogFixture.datasetFlow.modifiedAt,
        match: { kind: "lexical", score: 0.9, reasonCodes: ["name"] },
      },
    ],
  };
}

function versionsResponse(kind: unknown, id: unknown) {
  if (kind === "process" && id === catalogFixture.datasetProcess.key.id) {
    return catalogFixture.versions;
  }
  if (kind === "flow" && id === catalogFixture.datasetFlow.key.id) {
    return {
      ...catalogFixture.versions,
      dataset: { kind: "flow", id },
      items: [
        {
          key: catalogFixture.datasetFlow.key,
          accessLevel: catalogFixture.datasetFlow.accessLevel,
          capabilities: catalogFixture.datasetFlow.capabilities,
          modifiedAt: catalogFixture.datasetFlow.modifiedAt,
          isLatest: true,
        },
      ],
    };
  }
  return { ...catalogFixture.versions, dataset: { kind, id }, items: [], nextCursor: null };
}

function sitemapResponse(kind: unknown) {
  const processItem = catalogFixture.sitemap.items[0]!;
  const flowItem = {
    key: catalogFixture.datasetFlow.key,
    modifiedAt: catalogFixture.datasetFlow.modifiedAt,
  };
  return {
    ...catalogFixture.sitemap,
    items:
      kind === "process" ? [processItem] : kind === "flow" ? [flowItem] : [flowItem, processItem],
  };
}

function rpcPayload(name: string, arguments_: Record<string, unknown>): unknown {
  switch (name) {
    case "portal_search_processes_v1":
      return processSearchResponse();
    case "portal_search_flows_v1":
      return flowSearchResponse();
    case "portal_get_dataset_v1":
      if (
        arguments_.p_kind === "process" &&
        typeof arguments_.p_id === "string" &&
        /^8[0-9a-f]{7}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/u.test(arguments_.p_id) &&
        arguments_.p_version === catalogFixture.datasetProcess.key.version
      ) {
        return {
          ...processDataset(arguments_.p_id, "Electricity, medium voltage"),
        };
      }
      if (
        arguments_.p_kind === "process" &&
        arguments_.p_id === secondProcessId &&
        arguments_.p_version === catalogFixture.datasetProcess.key.version
      ) {
        return secondProcessDataset();
      }
      if (
        arguments_.p_kind === "process" &&
        arguments_.p_id === catalogFixture.datasetProcess.key.id &&
        arguments_.p_version === catalogFixture.datasetProcess.key.version
      ) {
        return processDataset(catalogFixture.datasetProcess.key.id, "Electricity, medium voltage");
      }
      if (
        arguments_.p_kind === "flow" &&
        arguments_.p_id === catalogFixture.datasetFlow.key.id &&
        arguments_.p_version === catalogFixture.datasetFlow.key.version
      ) {
        return catalogFixture.datasetFlow;
      }
      return null;
    case "portal_list_versions_v1":
      return versionsResponse(arguments_.p_kind, arguments_.p_id);
    case "portal_list_process_exchanges_v1":
      return arguments_.p_process_id === catalogFixture.datasetProcess.key.id &&
        arguments_.p_process_version === catalogFixture.datasetProcess.key.version
        ? catalogFixture.exchanges
        : null;
    case "portal_facets_v1":
      return { ...catalogFixture.facets, kind: arguments_.p_kind };
    case "portal_sitemap_entries_v1":
      return sitemapResponse(arguments_.p_kind);
    default:
      return undefined;
  }
}

function verifyPortalHmac(
  request: IncomingMessage,
  rawBody: Buffer,
  environment: (typeof environmentFixture)[PortalR1FixtureEnvironmentName],
  usedNonces: Set<string>,
):
  { ok: true; keyId: string; nonce: string; correlationId?: string } | { ok: false; code: string } {
  const keyId = request.headers["x-portal-key-id"];
  const timestamp = request.headers["x-portal-timestamp"];
  const nonce = request.headers["x-portal-nonce"];
  const suppliedBodyHash = request.headers["x-portal-body-sha256"];
  const suppliedSignature = request.headers["x-portal-signature"];
  const correlationId = request.headers["x-portal-correlation-id"];

  if (
    typeof keyId !== "string" ||
    typeof timestamp !== "string" ||
    typeof nonce !== "string" ||
    typeof suppliedBodyHash !== "string" ||
    typeof suppliedSignature !== "string" ||
    keyId !== environment.keyId ||
    !/^[1-9]\d*$/u.test(timestamp) ||
    !/^[A-Za-z0-9_-]+$/u.test(nonce) ||
    !/^[A-Za-z0-9_-]{43}$/u.test(suppliedBodyHash) ||
    !/^[A-Za-z0-9_-]{43}$/u.test(suppliedSignature) ||
    (correlationId !== undefined &&
      (typeof correlationId !== "string" ||
        !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/u.test(correlationId)))
  ) {
    return { ok: false, code: "invalid_signature" };
  }

  const timestampSeconds = Number(timestamp);
  if (
    !Number.isSafeInteger(timestampSeconds) ||
    Math.abs(Date.now() / 1000 - timestampSeconds) > 60
  ) {
    return { ok: false, code: "expired_signature" };
  }

  let nonceBytes: Buffer;
  let signatureBytes: Buffer;
  try {
    nonceBytes = Buffer.from(nonce, "base64url");
    signatureBytes = Buffer.from(suppliedSignature, "base64url");
  } catch {
    return { ok: false, code: "invalid_signature" };
  }
  if (
    nonceBytes.byteLength !== 16 ||
    nonceBytes.toString("base64url") !== nonce ||
    signatureBytes.byteLength !== 32
  ) {
    return { ok: false, code: "invalid_signature" };
  }

  const bodyHash = createHash("sha256").update(rawBody).digest("base64url");
  if (bodyHash !== suppliedBodyHash) {
    return { ok: false, code: "tampered_body" };
  }

  const canonical = [
    "portal-hmac-v1",
    keyId,
    timestamp,
    nonce,
    "POST",
    portalDataProductPath,
    bodyHash,
  ].join("\n");
  const expectedSignature = createHmac("sha256", Buffer.from(environment.hmacSecret, "base64url"))
    .update(canonical)
    .digest();
  if (!timingSafeEqual(expectedSignature, signatureBytes)) {
    return { ok: false, code: "invalid_signature" };
  }
  if (usedNonces.has(nonce)) {
    return { ok: false, code: "replayed_request" };
  }
  usedNonces.add(nonce);

  return {
    ok: true,
    keyId,
    nonce,
    ...(typeof correlationId === "string" ? { correlationId } : {}),
  };
}

function validLciaInput(value: Record<string, unknown>): boolean {
  if (Object.keys(value).sort().join("\n") !== requiredLciaKeys.join("\n")) {
    return false;
  }
  if (
    !["process_all_impacts", "processes_one_impact", "ranked_processes_one_impact"].includes(
      String(value.mode),
    ) ||
    !Array.isArray(value.processRefs) ||
    value.processRefs.length < 1 ||
    value.processRefs.length > 50 ||
    !Number.isInteger(value.limit) ||
    Number(value.limit) < 1 ||
    Number(value.limit) > 50 ||
    !(value.cursor === null || (typeof value.cursor === "string" && value.cursor.length <= 4096))
  ) {
    return false;
  }

  return value.processRefs.every(
    (reference) =>
      reference !== null &&
      typeof reference === "object" &&
      !Array.isArray(reference) &&
      Object.keys(reference).sort().join("\n") === "id\nversion" &&
      typeof (reference as Record<string, unknown>).id === "string" &&
      typeof (reference as Record<string, unknown>).version === "string",
  );
}

export async function startPortalR1FixtureServer(
  options: StartOptions,
): Promise<PortalR1FixtureServer> {
  const environment = environmentFixture[options.environment];
  if (!environment) {
    throw new Error("Unknown Portal R1 fixture environment");
  }

  const receipts: PortalR1FixtureReceipts = {
    rpcAccepted: 0,
    rpcByName: {},
    lciaAccepted: 0,
    rejected: 0,
    lastRpc: null,
    lastLcia: null,
  };
  const usedNonces = new Set<string>();
  const server = createServer(async (request, response) => {
    try {
      const requestUrl = new URL(request.url ?? "/", "http://fixture.local");
      if (request.method === "GET" && requestUrl.pathname === "/health") {
        writeJson(response, 200, {
          schemaVersion: "portal.r1-fixture-health.v1",
          environment: options.environment,
        });
        return;
      }
      if (request.method === "GET" && requestUrl.pathname === "/receipts") {
        writeJson(response, 200, {
          ...receipts,
          schemaVersion: "portal.r1-fixture-receipts.v1",
        });
        return;
      }

      const rawBody = await readRawBody(request);
      if (request.method !== "POST" || hasForbiddenCredential(request)) {
        receipts.rejected += 1;
        writeJson(response, 403, { code: "fixture_request_rejected" });
        return;
      }

      if (requestUrl.pathname.startsWith("/rest/v1/rpc/")) {
        const name = requestUrl.pathname.slice("/rest/v1/rpc/".length);
        if (
          request.headers.apikey !== environment.publishableKey ||
          request.headers["accept-profile"] !== "api" ||
          request.headers["content-profile"] !== "api"
        ) {
          receipts.rejected += 1;
          writeJson(response, 403, { code: "fixture_rpc_rejected" });
          return;
        }

        const arguments_ = parseJsonObject(rawBody);
        const payload =
          arguments_ && !containsForbiddenKey(arguments_)
            ? rpcPayload(name, arguments_)
            : undefined;
        if (payload === undefined) {
          receipts.rejected += 1;
          writeJson(response, 400, { code: "fixture_rpc_invalid" });
          return;
        }

        receipts.rpcAccepted += 1;
        receipts.rpcByName[name] = (receipts.rpcByName[name] ?? 0) + 1;
        receipts.lastRpc = { ...bodyReceipt(rawBody), name };
        writeJson(response, 200, payload);
        return;
      }

      if (requestUrl.pathname === portalDataProductPath) {
        if (request.headers.apikey !== environment.publishableKey) {
          receipts.rejected += 1;
          writeJson(response, 403, { code: "fixture_lcia_rejected" });
          return;
        }

        const verification = verifyPortalHmac(request, rawBody, environment, usedNonces);
        if (!verification.ok) {
          receipts.rejected += 1;
          writeJson(response, 403, { code: verification.code });
          return;
        }

        const input = parseJsonObject(rawBody);
        if (!input || !validLciaInput(input)) {
          receipts.rejected += 1;
          writeJson(response, 400, { code: "fixture_lcia_invalid" });
          return;
        }
        const references = input.processRefs as Array<Record<string, unknown>>;
        if (
          input.mode === "process_all_impacts" &&
          (references.length !== 1 || input.impactCategoryId !== null)
        ) {
          receipts.rejected += 1;
          writeJson(response, 400, { code: "fixture_lcia_invalid" });
          return;
        }
        if (input.mode !== "process_all_impacts" && typeof input.impactCategoryId !== "string") {
          receipts.rejected += 1;
          writeJson(response, 400, { code: "fixture_lcia_invalid" });
          return;
        }

        const allowedProcessIds = new Set([catalogFixture.datasetProcess.key.id, secondProcessId]);
        const referenceKeys = references.map(
          (reference) => `${String(reference.id)}@${String(reference.version)}`,
        );
        if (
          new Set(referenceKeys).size !== references.length ||
          !references.every(
            (reference) =>
              typeof reference.id === "string" &&
              allowedProcessIds.has(reference.id) &&
              reference.version === catalogFixture.datasetProcess.key.version,
          )
        ) {
          writeJson(response, 404, { code: "published_lcia_unavailable" });
          return;
        }

        const baseRow = catalogFixture.lcia.rows[0]!;
        const impactId =
          input.mode === "process_all_impacts" ? baseRow.impact.id : String(input.impactCategoryId);
        const rows = references.map((reference) => ({
          ...baseRow,
          process: { id: String(reference.id), version: String(reference.version) },
          impact: {
            ...baseRow.impact,
            id: impactId,
            name:
              impactId === baseRow.impact.id
                ? baseRow.impact.name
                : [{ language: "en", value: impactId }],
          },
          value: reference.id === secondProcessId ? "9.75" : baseRow.value,
        }));
        if (input.mode === "ranked_processes_one_impact") {
          rows.sort((left, right) => Number(right.value) - Number(left.value));
        }

        receipts.lciaAccepted += 1;
        receipts.lastLcia = {
          ...bodyReceipt(rawBody),
          keyId: verification.keyId,
          ...(verification.correlationId ? { correlationId: verification.correlationId } : {}),
        };
        writeJson(response, 200, {
          ...catalogFixture.lcia,
          mode: input.mode,
          rows,
          nextCursor: null,
        });
        return;
      }

      writeJson(response, 404, { code: "fixture_not_found" });
    } catch {
      receipts.rejected += 1;
      writeJson(response, 500, { code: "fixture_internal_error" });
    }
  });

  server.listen(options.port ?? 0, options.host ?? "127.0.0.1");
  await once(server, "listening");
  const address = server.address() as AddressInfo;
  const origin = `http://${options.host ?? "127.0.0.1"}:${address.port}`;

  return {
    environment: options.environment,
    origin,
    receipts,
    async close() {
      server.close();
      await once(server, "close");
    },
  };
}

type CommandLineOptions = {
  environment: PortalR1FixtureEnvironmentName;
  host: string;
  port: number;
};

function parseCommandLine(arguments_: string[]): CommandLineOptions {
  const options: CommandLineOptions = {
    environment: process.env.PORTAL_FIXTURE_ENV === "production" ? "production" : "preview",
    host: "127.0.0.1",
    port: Number(process.env.PORTAL_FIXTURE_PORT ?? 4328),
  };

  for (let index = 0; index < arguments_.length; index += 1) {
    const argument = arguments_[index];
    const value = arguments_[index + 1];
    if (argument === "--environment" && (value === "preview" || value === "production")) {
      options.environment = value;
      index += 1;
    } else if (argument === "--host" && value) {
      options.host = value;
      index += 1;
    } else if (argument === "--port" && value && /^\d+$/u.test(value)) {
      options.port = Number(value);
      index += 1;
    } else {
      throw new Error(`Unknown or invalid fixture argument: ${argument ?? "<missing>"}`);
    }
  }

  if (!Number.isInteger(options.port) || options.port < 1 || options.port > 65_535) {
    throw new Error("Fixture port must be between 1 and 65535");
  }
  if (options.host !== "127.0.0.1" && options.host !== "localhost") {
    throw new Error("Fixture host must be loopback");
  }

  return options;
}

async function runCommandLine(): Promise<void> {
  const options = parseCommandLine(process.argv.slice(2));
  const fixture = await startPortalR1FixtureServer(options);
  process.stdout.write(`Portal R1 ${fixture.environment} fixture listening at ${fixture.origin}\n`);

  const stop = async () => {
    await fixture.close();
    process.exitCode = 0;
  };
  process.once("SIGINT", stop);
  process.once("SIGTERM", stop);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await runCommandLine();
}
