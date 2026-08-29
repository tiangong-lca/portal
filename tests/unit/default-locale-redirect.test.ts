import { describe, expect, it } from "vitest";

import { redirectToDefaultLocale } from "@/server/routing/default-locale-redirect";

describe("default locale redirect", () => {
  it("keeps the request on the same origin and preserves path and query", () => {
    const response = redirectToDefaultLocale(
      new Request(
        "https://portal.tiangong.earth/search?v=1&kind=process&q=steel%20coil&m=a&m=b",
      ),
    );

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "/zh-CN/search?v=1&kind=process&q=steel%20coil&m=a&m=b",
    );
    expect(response.headers.get("cache-control")).toBe("no-store");
  });
});
