import { describe, expect, it, vi } from "vitest";
import fixture from "../fixtures/portal/catalog-v1.json";
import {
  collectionSummaryRequestSchema,
  collectionSummaryResponseSchema,
} from "@/lib/collection-summaries";
import { createCollectionSummaryHandler } from "@/server/collections/handler";
import { resolveCollectionSummaries } from "@/server/collections/summaries";
import { publicDatasetEnvelopeSchema } from "@/server/contracts/portal";
import type { getPublicDataset } from "@/server/data/catalog";

const ref = "11111111-1111-1111-1111-111111111111@01.00.000";
const input = { locale: "en" as const, items: [{ kind: null, ref }] };
const signal = () => new AbortController().signal;
function request(body: unknown = input, headers: Record<string, string> = {}) {
  return new Request("https://portal.example/internal/dataset-summaries", {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
}
function dataset(kind: "process" | "flow", id = ref.split("@")[0]) {
  const source = kind === "process" ? fixture.datasetProcess : fixture.datasetFlow;
  return publicDatasetEnvelopeSchema.parse({ ...source, key: { ...source.key, id } });
}

describe("bounded public shortlist summaries", () => {
  it("fails closed on cross-origin, credentials fields, malformed types/versions and request size", async () => {
    const resolve = vi.fn<typeof resolveCollectionSummaries>();
    const handler = createCollectionSummaryHandler(resolve);
    expect((await handler(request(input, { origin: "https://attacker.example" }))).status).toBe(
      403,
    );
    expect((await handler(request(input, { "sec-fetch-site": "cross-site" }))).status).toBe(403);
    for (const body of [
      { ...input, note: "private" },
      { ...input, items: [{ kind: "process", ref, stateCode: 20 }] },
      { ...input, items: [{ kind: "team", ref }] },
      { ...input, items: [{ kind: null, ref: ref.split("@")[0] }] },
      { ...input, items: Array.from({ length: 11 }, () => input.items[0]) },
    ])
      expect((await handler(request(body))).status).toBe(400);
    expect((await handler(request(input, { "content-type": "text/plain" }))).status).toBe(415);
    expect((await handler(request(input, { "content-length": "4097" }))).status).toBe(413);
    expect(resolve).not.toHaveBeenCalled();
  });

  it("distinguishes real cross-kind ambiguity without returning hidden fields or notes", async () => {
    const read = vi.fn<typeof getPublicDataset>(async ({ kind }) => dataset(kind));
    const result = await resolveCollectionSummaries(input, signal(), read);
    expect(result.items[0]?.status).toBe("ambiguous");
    expect(result.items[0]?.matches.map((match) => match.kind)).toEqual(["flow", "process"]);
    expect(Object.keys(result.items[0]!.matches[0]!).sort()).toEqual(["kind", "name", "ref"]);
    expect(JSON.stringify(result)).not.toContain("capabilities");
    expect(read).toHaveBeenCalledTimes(2);
  });

  it("does not guess a legacy type from a partial success", async () => {
    const read = vi.fn<typeof getPublicDataset>(async ({ kind }) => {
      if (kind === "flow") throw new Error("private diagnostic");
      return dataset(kind);
    });
    const result = await resolveCollectionSummaries(input, signal(), read);
    expect(result.items).toEqual([
      { kind: null, ref, status: "temporarily_unavailable", matches: [] },
    ]);
    expect(JSON.stringify(result)).not.toContain("private diagnostic");
  });

  it("looks up a known type once and returns the same unavailable shape for all nonpublic records", async () => {
    const read = vi.fn<typeof getPublicDataset>(async () => null);
    const result = await resolveCollectionSummaries(
      { ...input, items: [{ kind: "process", ref }] },
      signal(),
      read,
    );
    expect(result.items).toEqual([{ kind: "process", ref, status: "unavailable", matches: [] }]);
    expect(read).toHaveBeenCalledTimes(1);
  });

  it("limits public fanout to four RPCs and stops queued work when cancelled", async () => {
    let active = 0;
    let peak = 0;
    const read = vi.fn<typeof getPublicDataset>(async () => {
      active++;
      peak = Math.max(peak, active);
      await new Promise((resolve) => setTimeout(resolve, 1));
      active--;
      return null;
    });
    const many = collectionSummaryRequestSchema.parse({
      locale: "en",
      items: Array.from({ length: 10 }, (_, index) => ({
        kind: null,
        ref: `${String(index).padStart(8, "0")}-0000-0000-0000-000000000000@01.00.000`,
      })),
    });
    await resolveCollectionSummaries(many, signal(), read);
    expect(peak).toBe(4);
    expect(read).toHaveBeenCalledTimes(20);
    const aborted = new AbortController();
    aborted.abort();
    read.mockClear();
    expect(
      (await resolveCollectionSummaries(many, aborted.signal, read)).items.every(
        (item) => item.status === "temporarily_unavailable",
      ),
    ).toBe(true);
    expect(read).not.toHaveBeenCalled();
  });

  it("cancels chunked input beyond 4 KiB and returns no-store generic failures", async () => {
    let cancelled = false;
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new Uint8Array(4097));
      },
      cancel() {
        cancelled = true;
      },
    });
    const handler = createCollectionSummaryHandler();
    const response = await handler(
      new Request("https://portal.example/internal/dataset-summaries", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: stream,
        duplex: "half",
      } as RequestInit & { duplex: "half" }),
    );
    expect(response.status).toBe(413);
    expect(cancelled).toBe(true);
    expect(response.headers.get("cache-control")).toBe("no-store");
    const failed = createCollectionSummaryHandler(async () => {
      throw new Error("secret in diagnostic");
    });
    expect(await (await failed(request())).json()).toEqual({ code: "temporarily_unavailable" });
  });

  it("rejects response identity mismatches and extra data", () => {
    const valid = {
      items: [
        {
          kind: "process",
          ref,
          status: "resolved",
          matches: [{ kind: "flow", ref, name: "wrong table" }],
        },
      ],
    };
    expect(collectionSummaryResponseSchema.safeParse(valid).success).toBe(false);
    valid.items[0]!.matches[0]!.kind = "process";
    expect(collectionSummaryResponseSchema.safeParse(valid).success).toBe(true);
    expect(collectionSummaryResponseSchema.safeParse({ ...valid, note: "private" }).success).toBe(
      false,
    );
  });
});
