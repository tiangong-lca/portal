import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { runInNewContext } from "node:vm";
import { gzipSync } from "node:zlib";

const routeBudgets = [
  {
    label: "home",
    maximumGzipBytes: 120 * 1024,
    manifests: ["[locale]/page"],
  },
  {
    label: "detail",
    maximumGzipBytes: 180 * 1024,
    manifests: [
      "[locale]/flow/[ref]/page",
      "[locale]/flow/[ref]/versions/page",
      "[locale]/process/[ref]/page",
      "[locale]/process/[ref]/exchanges/page",
      "[locale]/process/[ref]/lcia/page",
      "[locale]/process/[ref]/method/page",
      "[locale]/process/[ref]/provenance/page",
      "[locale]/process/[ref]/quality/page",
      "[locale]/process/[ref]/versions/page",
    ],
  },
  {
    label: "search",
    maximumGzipBytes: 250 * 1024,
    manifests: ["[locale]/search/page"],
  },
];

async function routeChunks(manifestName) {
  const manifestPath = join(
    process.cwd(),
    ".next",
    "server",
    "app",
    `${manifestName}_client-reference-manifest.js`,
  );
  const source = await readFile(manifestPath, "utf8");
  const context = { globalThis: {} };
  runInNewContext(source, context, { filename: manifestPath, timeout: 1000 });
  const manifests = context.globalThis.__RSC_MANIFEST;
  const entries = manifests && typeof manifests === "object" ? Object.values(manifests) : [];
  if (entries.length !== 1) {
    throw new Error(`Expected one RSC manifest entry in ${manifestPath}`);
  }

  const entry = entries[0];
  if (!entry || typeof entry !== "object" || !entry.entryJSFiles) {
    throw new Error(`Missing entryJSFiles in ${manifestPath}`);
  }

  return [...new Set(Object.values(entry.entryJSFiles).flat())];
}

async function compressedRouteBytes(manifestName) {
  const chunks = await routeChunks(manifestName);
  let bytes = 0;

  for (const chunk of chunks) {
    if (typeof chunk !== "string" || !chunk.startsWith("static/chunks/")) {
      throw new Error(`Unexpected client chunk in ${manifestName}: ${String(chunk)}`);
    }
    const content = await readFile(join(process.cwd(), ".next", chunk));
    bytes += gzipSync(content, { level: 9 }).byteLength;
  }

  return { bytes, chunks: chunks.length };
}

const violations = [];
const evidence = [];

for (const budget of routeBudgets) {
  for (const manifest of budget.manifests) {
    const result = await compressedRouteBytes(manifest);
    evidence.push({
      family: budget.label,
      manifest,
      gzipBytes: result.bytes,
      chunks: result.chunks,
      maximumGzipBytes: budget.maximumGzipBytes,
    });
    if (result.bytes > budget.maximumGzipBytes) {
      violations.push(evidence.at(-1));
    }
  }
}

if (violations.length > 0) {
  throw new Error(
    `Portal route bundle budget exceeded:\n${violations
      .map(
        ({ family, manifest, gzipBytes, maximumGzipBytes }) =>
          `- ${family} ${manifest}: ${gzipBytes} > ${maximumGzipBytes} gzip bytes`,
      )
      .join("\n")}`,
  );
}

process.stdout.write(
  `Portal route bundle budgets OK:\n${evidence
    .map(
      ({ family, manifest, gzipBytes, chunks, maximumGzipBytes }) =>
        `- ${family} ${manifest}: ${gzipBytes}/${maximumGzipBytes} gzip bytes (${chunks} chunks)`,
    )
    .join("\n")}\n`,
);
