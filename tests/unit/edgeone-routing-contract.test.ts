import { existsSync, readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const repositoryRoot = process.cwd();
const middlewarePath = `${repositoryRoot}/src/middleware.ts`;
const proxyPath = `${repositoryRoot}/src/proxy.ts`;

describe("EdgeOne native routing contract", () => {
  it("does not ship a Next Proxy or middleware entrypoint", () => {
    expect(existsSync(proxyPath)).toBe(false);
    expect(existsSync(middlewarePath)).toBe(false);
  });

  it("uses bounded native redirects and routing evidence headers", () => {
    const configuration = JSON.parse(
      readFileSync(`${repositoryRoot}/edgeone.json`, "utf8"),
    ) as Record<string, unknown>;

    expect(configuration.redirects).toEqual([
      { source: "/", destination: "/zh-CN", statusCode: 302 },
      { source: "/search", destination: "/zh-CN/search", statusCode: 302 },
      { source: "/compare", destination: "/zh-CN/compare", statusCode: 302 },
      { source: "/collections", destination: "/zh-CN/collections", statusCode: 302 },
      { source: "/methodology", destination: "/zh-CN/methodology", statusCode: 302 },
      { source: "/browse/*", destination: "/zh-CN/browse/:splat", statusCode: 302 },
      { source: "/process/*", destination: "/zh-CN/process/:splat", statusCode: 302 },
      { source: "/flow/*", destination: "/zh-CN/flow/:splat", statusCode: 302 },
    ]);
    expect(configuration.headers).toEqual([
      {
        source: "/r0-compat",
        headers: [{ key: "X-Portal-Routing", value: "edgeone-native-v1" }],
      },
      {
        source: "/r0-compat/*",
        headers: [{ key: "X-Portal-Routing", value: "edgeone-native-v1" }],
      },
    ]);
  });
});
