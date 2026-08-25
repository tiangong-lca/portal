import { readdir, readFile } from "node:fs/promises";
import { extname, join } from "node:path";

const staticRoot = join(process.cwd(), ".next", "static");
const forbidden = [
  "PORTAL_EDGE_HMAC_SECRET",
  "R0_COMPAT_HMAC_SECRET",
  "SUPABASE_SECRET_KEY",
  "service_role",
  "portal_bundle_secret_sentinel_v1",
];
const searchableExtensions = new Set([".js", ".json", ".map", ".txt"]);

async function collectFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const path = join(directory, entry.name);

    if (entry.isDirectory()) {
      files.push(...(await collectFiles(path)));
    } else if (searchableExtensions.has(extname(entry.name))) {
      files.push(path);
    }
  }

  return files;
}

const violations = [];

for (const path of await collectFiles(staticRoot)) {
  const content = await readFile(path, "utf8");

  for (const marker of forbidden) {
    if (content.includes(marker)) {
      violations.push({ marker, path });
    }
  }
}

if (violations.length > 0) {
  throw new Error(
    `Client bundle contains forbidden server markers:\n${violations
      .map(({ marker, path }) => `- ${marker}: ${path}`)
      .join("\n")}`,
  );
}

process.stdout.write("Portal client bundle secret scan OK.\n");
