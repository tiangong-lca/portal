// @vitest-environment node

import { createHash } from "node:crypto";

import { afterEach, describe, expect, it } from "vitest";

import environmentFixture from "../fixtures/portal/r1-environments.json";

import { publicSearchPageSchema } from "@/server/contracts/portal";
import {
  getPublicDataset,
  getPublicFacets,
  listPublicDatasetVersions,
  listPublicProcessExchanges,
  listPublicSitemapEntries,
  searchPublicFlows,
} from "@/server/data/catalog";
import { createPortalRpcClient } from "@/server/data/supabase-rpc";
import {
  portalDataProductFunctionPath,
  queryPublishedLcia,
  queryPublishedLciaRaw,
} from "@/server/lcia/client";
import { signPortalHmac } from "@/server/r0-compat/hmac";
import {
  startPortalR1FixtureServer,
  type PortalR1FixtureEnvironmentName,
  type PortalR1FixtureServer,
} from "../../scripts/portal-r1-fixture-server";

const processReference = {
  id: "11111111-1111-1111-1111-111111111111",
  version: "01.00.000",
};
const runningServers: PortalR1FixtureServer[] = [];

async function start(environment: PortalR1FixtureEnvironmentName) {
  const fixture = await startPortalR1FixtureServer({ environment });
  runningServers.push(fixture);
  return fixture;
}

function dataEnvironment(environment: PortalR1FixtureEnvironmentName, origin: string) {
  return {
    supabaseUrl: origin,
    publishableKey: environmentFixture[environment].publishableKey,
    timeoutMilliseconds: 1000,
  };
}

function lciaEnvironment(environment: PortalR1FixtureEnvironmentName, origin: string) {
  return {
    ...dataEnvironment(environment, origin),
    edgeOrigin: origin,
    edgeTimeoutMilliseconds: 1000,
    keyId: environmentFixture[environment].keyId,
    secret: environmentFixture[environment].hmacSecret,
  };
}

afterEach(async () => {
  await Promise.all(runningServers.splice(0).map((fixture) => fixture.close()));
});

describe("Portal R1 fixture upstream", () => {
  it("accepts only publishable-key api-profile RPC calls", async () => {
    const fixture = await start("preview");
    const client = createPortalRpcClient({
      environment: dataEnvironment("preview", fixture.origin),
    });

    const page = await client.call(
      "portal_search_processes_v1",
      { p_query: "electricity", p_filters: {}, p_sort: "relevance", p_cursor: null, p_limit: 20 },
      publicSearchPageSchema,
      { mode: "no-store" },
    );
    expect(page.items[0]?.key).toEqual({ kind: "process", ...processReference });

    const flowSearch = await searchPublicFlows({ query: "carbon dioxide" }, client);
    const processDataset = await getPublicDataset({ kind: "process", ...processReference }, client);
    const flowDataset = await getPublicDataset(
      {
        kind: "flow",
        id: "22222222-2222-2222-2222-222222222222",
        version: "01.00.000",
      },
      client,
    );
    const versions = await listPublicDatasetVersions(
      { kind: "process", id: processReference.id },
      client,
    );
    const exchanges = await listPublicProcessExchanges(
      { processId: processReference.id, processVersion: processReference.version },
      client,
    );
    const facets = await getPublicFacets({ kind: "all", query: "electricity" }, client);
    const sitemap = await listPublicSitemapEntries({}, client);

    expect(flowSearch.items[0]?.key.kind).toBe("flow");
    expect(processDataset?.metadata.kind).toBe("process");
    expect(flowDataset?.metadata.kind).toBe("flow");
    expect(versions.items[0]?.isLatest).toBe(true);
    expect(exchanges?.rows[0]?.amount).toBe("1.25");
    expect(facets.kind).toBe("all");
    expect(sitemap.items.map((item) => item.key.kind)).toEqual(["flow", "process"]);
    expect(fixture.receipts.rpcAccepted).toBe(8);
    expect(fixture.receipts.rpcByName).toMatchObject({
      portal_get_dataset_v1: 2,
      portal_search_flows_v1: 1,
      portal_search_processes_v1: 1,
    });
    expect(fixture.receipts.lastRpc).toMatchObject({ name: "portal_sitemap_entries_v1" });

    const missingProfile = await fetch(`${fixture.origin}/rest/v1/rpc/portal_search_processes_v1`, {
      method: "POST",
      body: "{}",
      headers: { apikey: environmentFixture.preview.publishableKey },
    });
    expect(missingProfile.status).toBe(403);

    const bearerCredential = await fetch(
      `${fixture.origin}/rest/v1/rpc/portal_search_processes_v1`,
      {
        method: "POST",
        body: "{}",
        headers: {
          apikey: environmentFixture.preview.publishableKey,
          "accept-profile": "api",
          authorization: "Bearer forbidden-user-jwt",
          "content-profile": "api",
        },
      },
    );
    expect(bearerCredential.status).toBe(403);
    expect(fixture.receipts.rejected).toBe(2);

    const receiptProbe = await fetch(`${fixture.origin}/receipts`);
    expect(await receiptProbe.json()).toMatchObject({
      schemaVersion: "portal.r1-fixture-receipts.v1",
      rpcAccepted: 8,
    });
  });

  it("verifies HMAC against the exact raw body before returning LCIA", async () => {
    const fixture = await start("preview");
    const body = `  ${JSON.stringify({
      mode: "process_all_impacts",
      processRefs: [processReference],
      impactCategoryId: null,
      cursor: null,
      limit: 20,
    })}\n`;

    const result = await queryPublishedLciaRaw(new TextEncoder().encode(body), {
      environment: lciaEnvironment("preview", fixture.origin),
    });

    expect(result.status).toBe("available");
    expect(result.data?.rows[0]?.value).toBe("12.5");
    expect(fixture.receipts.lciaAccepted).toBe(1);
    expect(fixture.receipts.lastLcia).toEqual({
      bodyBytes: Buffer.byteLength(body),
      bodySha256: createHash("sha256").update(body).digest("hex"),
      keyId: environmentFixture.preview.keyId,
    });
  });

  it("rejects tampered raw bytes and replayed canonical signatures", async () => {
    const fixture = await start("preview");
    const rawBody = new TextEncoder().encode(
      JSON.stringify({
        mode: "process_all_impacts",
        processRefs: [processReference],
        impactCategoryId: null,
        cursor: null,
        limit: 20,
      }),
    );
    const signed = await signPortalHmac({
      rawBody,
      keyId: environmentFixture.preview.keyId,
      secret: environmentFixture.preview.hmacSecret,
      timestamp: Math.floor(Date.now() / 1000),
      nonce: "AAAAAAAAAAAAAAAAAAAAAA",
      functionPath: portalDataProductFunctionPath,
    });
    const headers = {
      ...signed.headers,
      apikey: environmentFixture.preview.publishableKey,
      "content-type": "application/json",
    };

    const tampered = await fetch(`${fixture.origin}${portalDataProductFunctionPath}`, {
      method: "POST",
      body: Buffer.concat([Buffer.from(rawBody), Buffer.from(" ")]),
      headers,
    });
    expect(tampered.status).toBe(403);
    expect(await tampered.json()).toEqual({ code: "tampered_body" });

    const accepted = await fetch(`${fixture.origin}${portalDataProductFunctionPath}`, {
      method: "POST",
      body: rawBody,
      headers,
    });
    expect(accepted.status).toBe(200);

    const replayed = await fetch(`${fixture.origin}${portalDataProductFunctionPath}`, {
      method: "POST",
      body: rawBody,
      headers,
    });
    expect(replayed.status).toBe(403);
    expect(await replayed.json()).toEqual({ code: "replayed_request" });
    expect(fixture.receipts.lciaAccepted).toBe(1);
    expect(fixture.receipts.rejected).toBe(2);
  });

  it("isolates Preview and Production publishable/HMAC credentials", async () => {
    const preview = await start("preview");
    const production = await start("production");
    const input = {
      mode: "process_all_impacts" as const,
      processRefs: [processReference],
      impactCategoryId: null,
      cursor: null,
      limit: 20,
    };

    await expect(
      queryPublishedLcia(input, {
        environment: lciaEnvironment("preview", preview.origin),
      }),
    ).resolves.toMatchObject({ status: "available" });
    await expect(
      queryPublishedLcia(input, {
        environment: lciaEnvironment("production", production.origin),
      }),
    ).resolves.toMatchObject({ status: "available" });

    await expect(
      queryPublishedLcia(input, {
        environment: { ...lciaEnvironment("preview", production.origin) },
      }),
    ).resolves.toEqual({ status: "temporarily_unavailable", data: null });

    const crossEnvironmentRpc = createPortalRpcClient({
      environment: { ...dataEnvironment("preview", production.origin) },
    });
    await expect(
      crossEnvironmentRpc.call(
        "portal_search_processes_v1",
        { p_query: "electricity" },
        publicSearchPageSchema,
        { mode: "no-store" },
      ),
    ).rejects.toMatchObject({ code: "upstream_unavailable" });

    expect(preview.receipts.lciaAccepted).toBe(1);
    expect(production.receipts.lciaAccepted).toBe(1);
    expect(production.receipts.rejected).toBe(2);
  });
});
