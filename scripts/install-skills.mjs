import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  cpSync,
  existsSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  renameSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = fileURLToPath(new URL("../", import.meta.url));
const lockPath = join(projectRoot, "skills-lock.json");
const skillNames = ["init", "setup", "stories", "upgrade"];
const source = "storybookjs/mcp";
const sourcePath = "packages/codex-plugin/plugins/storybook/skills";
const commitPattern = /^[0-9a-f]{40}$/;

function validateLock(lock, expectedRef) {
  if (
    lock.version !== 1 ||
    Object.keys(lock.skills ?? {})
      .sort()
      .join() !== skillNames.join()
  ) {
    throw new Error("skills-lock.json must contain exactly the four official Storybook skills.");
  }
  const ref = expectedRef ?? lock.skills.init.ref;
  if (!commitPattern.test(ref ?? "")) {
    throw new Error("Storybook skills must be pinned to a full 40-character commit SHA.");
  }
  for (const name of skillNames) {
    const entry = lock.skills[name];
    if (
      entry?.source !== source ||
      entry.sourceType !== "github" ||
      entry.sourceUrl !== undefined ||
      entry.ref !== ref ||
      entry.skillPath !== `${sourcePath}/${name}/SKILL.md` ||
      !/^[0-9a-f]{64}$/.test(entry.computedHash ?? "")
    ) {
      throw new Error(
        `Invalid locked source for ${name}; review skills-lock.json before installing.`,
      );
    }
  }
}

function sourceFiles(directory, root = directory) {
  if (!lstatSync(directory).isDirectory())
    throw new Error(`Expected a skill directory: ${directory}`);
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      return [".git", "node_modules"].includes(entry.name) ? [] : sourceFiles(path, root);
    }
    if (!entry.isFile()) throw new Error(`Unsupported skill file: ${path}`);
    return [{ path: relative(root, path).split("\\").join("/"), content: readFileSync(path) }];
  });
}

function prepareSkills(staging, lock) {
  const license = readFileSync(new URL("./licenses/storybook-mcp.txt", import.meta.url));
  for (const name of skillNames) {
    const directory = join(staging, ".agents/skills", name);
    if (!existsSync(join(directory, "SKILL.md"))) {
      throw new Error(`Skills CLI did not restore ${name}/SKILL.md.`);
    }
    const files = sourceFiles(directory).sort((a, b) => a.path.localeCompare(b.path));
    // Match Skills CLI 1.5.24's path + bytes hash, before applying local adaptations.
    const hash = createHash("sha256");
    for (const file of files) hash.update(file.path).update(file.content);
    if (hash.digest("hex") !== lock.skills[name].computedHash) {
      throw new Error(`Locked content hash mismatch for ${name}; existing skills were preserved.`);
    }
    const target = join(staging, "prepared", `storybook-${name}`);
    for (const file of files) {
      const output = join(target, file.path);
      mkdirSync(dirname(output), { recursive: true });
      writeFileSync(output, file.content);
    }
    const documentPath = join(target, "SKILL.md");
    const document = readFileSync(documentPath, "utf8");
    const namePattern = new RegExp(`^(---\\r?\\n)name: ${name}(\\r?\\n)`);
    if (!namePattern.test(document)) throw new Error(`Unexpected upstream skill name: ${name}`);
    writeFileSync(
      documentPath,
      document
        .replace(namePattern, `$1name: storybook-${name}$2`)
        .replace(/\$storybook:(init|setup|stories|upgrade)\b/g, "$$storybook-$1"),
    );
    writeFileSync(join(target, "LICENSE"), license);
    writeFileSync(
      join(target, "UPSTREAM.md"),
      `# Official Storybook skill\n\nSource: https://github.com/${source}/tree/${lock.skills[name].ref}/${sourcePath}/${name}\n\nRestored by pnpm skills:install from skills-lock.json. MIT licensed. The only local adaptations are the storybook- skill name prefix and matching cross-skill references, replacing plugin namespaces. This directory is ignored by Git.\n`,
    );
  }
}

function installPrepared(staging, updatedLock) {
  const skillsRoot = join(projectRoot, ".agents/skills");
  mkdirSync(skillsRoot, { recursive: true });
  const transaction = mkdtempSync(join(skillsRoot, ".storybook-install-"));
  const installed = [];
  const backedUp = [];
  let cleanup = false;
  try {
    cpSync(join(staging, "prepared"), join(transaction, "prepared"), { recursive: true });
    for (const name of skillNames.map((name) => `storybook-${name}`)) {
      const target = join(skillsRoot, name);
      if (existsSync(target)) {
        renameSync(target, join(transaction, name));
        backedUp.push(name);
      }
      renameSync(join(transaction, "prepared", name), target);
      installed.push(name);
    }
    if (updatedLock) {
      const pendingLock = join(transaction, "skills-lock.json");
      writeFileSync(pendingLock, updatedLock);
      renameSync(pendingLock, lockPath);
    }
    cleanup = true;
  } catch (error) {
    for (const name of installed) rmSync(join(skillsRoot, name), { recursive: true, force: true });
    for (const name of backedUp) renameSync(join(transaction, name), join(skillsRoot, name));
    cleanup = true;
    throw error;
  } finally {
    // Keep backups available if the filesystem also prevents rollback.
    if (cleanup) rmSync(transaction, { recursive: true, force: true });
  }
}

function main() {
  const args = process.argv.slice(2);
  const updating = args[0] === "--update";
  if (args.length && (!updating || args.length !== 2 || !commitPattern.test(args[1]))) {
    throw new Error("Usage: pnpm skills:install OR pnpm skills:update <full-storybook-commit-sha>");
  }
  const originalLock = readFileSync(lockPath, "utf8");
  let lock = JSON.parse(originalLock);
  validateLock(lock);
  const require = createRequire(import.meta.url);
  const packagePath = require.resolve("skills/package.json");
  const cli = join(dirname(packagePath), JSON.parse(readFileSync(packagePath, "utf8")).bin.skills);
  const staging = mkdtempSync(join(tmpdir(), "portal-skills-"));
  try {
    if (!updating) writeFileSync(join(staging, "skills-lock.json"), originalLock);
    console.log(
      updating ? `Locking Storybook skills at ${args[1]}…` : "Restoring locked Storybook skills…",
    );
    const cliArguments = updating
      ? [
          "add",
          `${source}/${sourcePath}#${args[1]}`,
          "--skill",
          ...skillNames,
          "--agent",
          "codex",
          "--copy",
          "--yes",
        ]
      : ["experimental_install"];
    const result = spawnSync(process.execPath, [cli, ...cliArguments], {
      cwd: staging,
      encoding: "utf8",
      env: { ...process.env, DISABLE_TELEMETRY: "1" },
      timeout: 120_000,
    });
    if (result.error || result.status !== 0) {
      throw new Error(
        `Skills CLI failed: ${result.error?.message ?? result.stderr ?? result.stdout}`,
      );
    }
    if (updating) {
      lock = JSON.parse(readFileSync(join(staging, "skills-lock.json"), "utf8"));
      validateLock(lock, args[1]);
    }
    // experimental_install can exit successfully after partial failures and rewrites its lock.
    // Verify every downloaded skill against our original lock, never the rewritten copy.
    prepareSkills(staging, lock);
    if (readFileSync(lockPath, "utf8") !== originalLock) {
      throw new Error("skills-lock.json changed during installation; retry with the current lock.");
    }
    installPrepared(staging, updating ? `${JSON.stringify(lock, null, 2)}\n` : undefined);
    console.log("Installed 4 verified project skills in .agents/skills/storybook-*/.");
    if (updating) console.log("Review and commit skills-lock.json to share the update.");
  } finally {
    rmSync(staging, { recursive: true, force: true });
  }
}

try {
  main();
} catch (error) {
  console.error(`Skill installation failed: ${error.message}`);
  process.exitCode = 1;
}
