import { spawnSync } from "node:child_process";

const allowedLicenses = new Set([
  "0BSD",
  "Apache-2.0",
  "Apache-2.0 AND MIT",
  "BSD-2-Clause",
  "BSD-3-Clause",
  "BlueOak-1.0.0",
  "CC-BY-4.0",
  "CC0-1.0",
  "ISC",
  "MIT",
  "MIT-0",
  "MPL-2.0",
  "Python-2.0",
]);

const packageScopedLicenses = new Map([
  ["LGPL-3.0-or-later", [/^@img\/sharp-libvips-/]],
]);

const command = process.platform === "win32" ? "pnpm.cmd" : "pnpm";
const environment = { ...process.env, NO_COLOR: "1" };
delete environment.FORCE_COLOR;
const result = spawnSync(command, ["licenses", "list", "--json", "--long"], {
  encoding: "utf8",
  env: environment,
});

if (result.status !== 0) {
  process.stderr.write(result.stderr || "Unable to enumerate dependency licenses.\n");
  process.exit(result.status ?? 1);
}

const report = JSON.parse(result.stdout);
const violations = [];
let packageCount = 0;

for (const [license, packages] of Object.entries(report)) {
  if (!Array.isArray(packages)) {
    violations.push(`${license}: malformed pnpm license report`);
    continue;
  }
  packageCount += packages.length;
  if (allowedLicenses.has(license)) continue;

  const allowedPatterns = packageScopedLicenses.get(license) ?? [];
  for (const package_ of packages) {
    const name = typeof package_?.name === "string" ? package_.name : "<unknown>";
    if (!allowedPatterns.some((pattern) => pattern.test(name))) {
      violations.push(`${name}: ${license}`);
    }
  }
}

if (violations.length > 0) {
  process.stderr.write(`Dependency license policy rejected:\n- ${violations.join("\n- ")}\n`);
  process.exit(1);
}

process.stdout.write(
  `Portal dependency license policy OK: ${packageCount} packages across ${Object.keys(report).length} license groups.\n`,
);
