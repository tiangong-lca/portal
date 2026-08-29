import { existsSync, readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const repositoryRoot = process.cwd();
const middlewarePath = `${repositoryRoot}/src/middleware.ts`;
const proxyPath = `${repositoryRoot}/src/proxy.ts`;

describe("EdgeOne Proxy compatibility contract", () => {
  it("uses the Next.js 16 Proxy filename and leaves no legacy middleware entrypoint", () => {
    expect(existsSync(proxyPath)).toBe(true);
    expect(existsSync(middlewarePath)).toBe(false);
  });

  it("exposes both handler shapes used by Next and the EdgeOne OpenNext adapter", () => {
    const source = readFileSync(proxyPath, "utf8");

    expect(source).toContain("export { proxy }");
    expect(source).toContain("export default proxy");
    expect(source).toContain('response.headers.set("x-portal-proxy", "r0-v1")');
  });
});
