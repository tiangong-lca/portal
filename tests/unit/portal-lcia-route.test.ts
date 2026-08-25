import { describe, expect, it } from "vitest";

import { POST } from "@/app/internal/lcia/route";

function request(body: string, headers: HeadersInit = {}) {
  return new Request("https://portal.example/internal/lcia", {
    method: "POST",
    body,
    headers,
  });
}

describe("Portal LCIA same-origin Route Handler", () => {
  it("rejects cross-origin browser posts before signing", async () => {
    const response = await POST(
      request("{}", { "content-type": "application/json", origin: "https://attacker.example" }),
    );

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({ code: "cross_origin_request" });
  });

  it("requires JSON and a bounded request body", async () => {
    const wrongType = await POST(request("{}", { "content-type": "text/plain" }));
    expect(wrongType.status).toBe(415);

    const oversized = await POST(
      request("{}", {
        "content-length": String(16 * 1024 + 1),
        "content-type": "application/json",
      }),
    );
    expect(oversized.status).toBe(413);
  });

  it("returns a generic 400 for malformed LCIA JSON without requiring secrets", async () => {
    const response = await POST(request("not-json", { "content-type": "application/json" }));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ code: "invalid_request" });
    expect(response.headers.get("cache-control")).toBe("no-store");
  });
});
