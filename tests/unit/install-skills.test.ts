// @vitest-environment node
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  cpSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

const repository = fileURLToPath(new URL("../../", import.meta.url));
const names = ["init", "setup", "stories", "upgrade"];
const ref = "a".repeat(40);
let project: string;
let lockText: string;

function write(path: string, content: string) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, content);
}

function run(args: string[] = [], mode = "success") {
  return spawnSync(process.execPath, [join(project, "scripts/install-skills.mjs"), ...args], {
    // The installer must find its own project even when invoked from another directory.
    cwd: tmpdir(),
    encoding: "utf8",
    env: { ...process.env, PORTAL_SKILLS_FIXTURE: project, PORTAL_SKILLS_TEST_MODE: mode },
  });
}

function installedDocuments() {
  return names.map((name) =>
    readFileSync(join(project, ".agents/skills", `storybook-${name}`, "SKILL.md"), "utf8"),
  );
}

beforeEach(() => {
  project = mkdtempSync(join(tmpdir(), "portal skills test "));
  mkdirSync(join(project, "scripts/licenses"), { recursive: true });
  cpSync(
    join(repository, "scripts/install-skills.mjs"),
    join(project, "scripts/install-skills.mjs"),
  );
  cpSync(
    join(repository, "scripts/licenses/storybook-mcp.txt"),
    join(project, "scripts/licenses/storybook-mcp.txt"),
  );
  const skills = Object.fromEntries(
    names.map((name) => {
      const document = `---\nname: ${name}\ndescription: Test skill.\n---\nUse $storybook:stories and $storybook:setup.\n`;
      write(join(project, "fixture", name, "SKILL.md"), document);
      write(join(project, "fixture", name, "references/example.md"), "Nested reference.\n");
      return [
        name,
        {
          source: "storybookjs/mcp",
          ref,
          sourceType: "github",
          skillPath: `packages/codex-plugin/plugins/storybook/skills/${name}/SKILL.md`,
          computedHash: createHash("sha256")
            .update("references/example.md")
            .update("Nested reference.\n")
            .update("SKILL.md")
            .update(document)
            .digest("hex"),
        },
      ];
    }),
  );
  lockText = `${JSON.stringify({ version: 1, skills }, null, 2)}\n`;
  write(join(project, "skills-lock.json"), lockText);
  write(join(project, "fixture/skills-lock.json"), lockText);
  write(
    join(project, "node_modules/skills/package.json"),
    JSON.stringify({ name: "skills", bin: { skills: "bin/cli.mjs" } }),
  );
  // Exercise the real CLI boundary without network access in ordinary unit/CI tests.
  write(
    join(project, "node_modules/skills/bin/cli.mjs"),
    `
    import { cpSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
    import { join } from "node:path";
    const project = process.env.PORTAL_SKILLS_FIXTURE;
    const mode = process.env.PORTAL_SKILLS_TEST_MODE;
    const args = process.argv.slice(2);
    writeFileSync(join(project, "invocation.json"), JSON.stringify({ args, cwd: process.cwd() }));
    if (mode === "failure") { console.error("network unavailable"); process.exit(1); }
    const lock = JSON.parse(readFileSync(join(project, "fixture/skills-lock.json"), "utf8"));
    for (const name of Object.keys(lock.skills)) {
      if (mode === "partial" && name === "upgrade") continue;
      const target = join(process.cwd(), ".agents/skills", name);
      mkdirSync(target, { recursive: true });
      cpSync(join(project, "fixture", name), target, { recursive: true });
      if (mode === "tampered") writeFileSync(join(target, "references/example.md"), "Changed source.");
      if (args[0] === "add") lock.skills[name].ref = args[1].split("#")[1];
      if (mode === "tampered") lock.skills[name].computedHash = "0".repeat(64);
    }
    // The real restore command can rewrite its lock and return zero after partial failure.
    writeFileSync("skills-lock.json", JSON.stringify(lock));
  `,
  );
});

afterEach(() => rmSync(project, { recursive: true, force: true }));

describe("project skills installation", () => {
  it("restores prefixed skills, nested files and notices without changing the lock or other skills", () => {
    write(join(project, ".agents/skills/local-helper/SKILL.md"), "Keep this local skill.");
    const result = run();
    expect(result.stderr).toBe("");
    expect(result.status).toBe(0);
    expect(readFileSync(join(project, "skills-lock.json"), "utf8")).toBe(lockText);
    expect(JSON.parse(readFileSync(join(project, "invocation.json"), "utf8"))).toEqual({
      args: ["experimental_install"],
      cwd: expect.not.stringContaining(project),
    });
    for (const name of names) {
      const directory = join(project, ".agents/skills", `storybook-${name}`);
      const document = readFileSync(join(directory, "SKILL.md"), "utf8");
      expect(document).toContain(`name: storybook-${name}\n`);
      expect(document).toContain("Use $storybook-stories and $storybook-setup.");
      expect(readFileSync(join(directory, "references/example.md"), "utf8")).toBe(
        "Nested reference.\n",
      );
      expect(readFileSync(join(directory, "LICENSE"), "utf8")).toContain(
        "Copyright (c) 2023 Storybook contributors",
      );
      expect(readFileSync(join(directory, "UPSTREAM.md"), "utf8")).toContain(`/tree/${ref}/`);
    }
    expect(readdirSync(join(project, ".agents/skills")).sort()).toEqual([
      "local-helper",
      ...names.map((name) => `storybook-${name}`),
    ]);
    expect(readFileSync(join(project, ".agents/skills/local-helper/SKILL.md"), "utf8")).toBe(
      "Keep this local skill.",
    );
    const before = installedDocuments();
    expect(run().status).toBe(0);
    expect(installedDocuments()).toEqual(before);
    expect(readFileSync(join(project, "skills-lock.json"), "utf8")).toBe(lockText);
  });

  it.each([
    ["failure", "network unavailable"],
    ["partial", "did not restore upgrade/SKILL.md"],
    ["tampered", "Locked content hash mismatch"],
  ])("preserves existing skills and the lock after %s", (mode, message) => {
    for (const name of names)
      write(join(project, ".agents/skills", `storybook-${name}`, "SKILL.md"), `Existing ${name}`);
    const before = installedDocuments();
    const result = run([], mode);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain(message);
    expect(installedDocuments()).toEqual(before);
    expect(readFileSync(join(project, "skills-lock.json"), "utf8")).toBe(lockText);
  });

  it("rejects floating source refs before calling the downloader", () => {
    write(join(project, "skills-lock.json"), lockText.replaceAll(ref, "main"));
    const result = run();
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("full 40-character commit SHA");
    expect(readdirSync(project)).not.toContain("invocation.json");
  });

  it("updates only to an explicit commit and writes the verified CLI-generated lock", () => {
    const nextRef = "b".repeat(40);
    expect(run(["--update", "main"]).status).toBe(1);
    expect(run(["--update", nextRef]).status).toBe(0);
    const updated = JSON.parse(readFileSync(join(project, "skills-lock.json"), "utf8"));
    expect(Object.values(updated.skills).map((entry) => (entry as { ref: string }).ref)).toEqual(
      names.map(() => nextRef),
    );
    expect(JSON.parse(readFileSync(join(project, "invocation.json"), "utf8")).args).toEqual([
      "add",
      `storybookjs/mcp/packages/codex-plugin/plugins/storybook/skills#${nextRef}`,
      "--skill",
      ...names,
      "--agent",
      "codex",
      "--copy",
      "--yes",
    ]);
    expect(
      readFileSync(join(project, ".agents/skills/storybook-init/UPSTREAM.md"), "utf8"),
    ).toContain(`/tree/${nextRef}/`);
  });
});
