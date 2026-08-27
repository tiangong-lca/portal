import { spawnSync } from "node:child_process";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import forbiddenBrowserMarkers from "../fixtures/security/browser-private-markers.json" with { type: "json" };

describe("browser private marker contract", () => {
  const temporaryRoots: string[] = [];

  afterEach(async () => {
    await Promise.all(
      temporaryRoots.splice(0).map((root) => rm(root, { force: true, recursive: true })),
    );
  });

  it("rejects raw JSON, Flight-escaped HTML, and minified private keys", async () => {
    for (const marker of ["team_id", "model_id", "search_text"]) {
      expect(forbiddenBrowserMarkers).toContain(marker);
    }

    const root = await mkdtemp(join(tmpdir(), "portal-browser-marker-"));
    temporaryRoots.push(root);
    const staticRoot = join(root, ".next", "static");
    await mkdir(staticRoot, { recursive: true });
    await writeFile(
      join(staticRoot, "fixture.js"),
      ['{"team_id":"private"}', '{\\"model_id\\":\\"private\\"}', "search_text:private"].join("\n"),
    );

    const result = spawnSync(
      process.execPath,
      [resolve(process.cwd(), "scripts/check-client-bundle.mjs")],
      { cwd: root, encoding: "utf8" },
    );

    expect(result.status).toBe(1);
    expect(result.stderr).toContain("team_id");
    expect(result.stderr).toContain("model_id");
    expect(result.stderr).toContain("search_text");
  });
});
