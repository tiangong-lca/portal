import { existsSync, readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const repositoryRoot = process.cwd();
const middlewarePath = `${repositoryRoot}/src/middleware.ts`;
const proxyPath = `${repositoryRoot}/src/proxy.ts`;

describe("EdgeOne middleware compatibility contract", () => {
  it("uses the legacy Edge middleware filename while OpenNext lacks Node proxy support", () => {
    expect(existsSync(middlewarePath)).toBe(true);
    expect(existsSync(proxyPath)).toBe(false);
  });

  it("exposes both handler shapes used by Next and the EdgeOne OpenNext adapter", () => {
    const source = readFileSync(middlewarePath, "utf8");

    expect(source).toContain("export { middleware }");
    expect(source).toContain("export default middleware");
    expect(source).toContain('response.headers.set("x-portal-proxy", "r0-v1")');
  });
});
