import { describe, expect, it } from "vitest";

import HomePage from "@/app/(default)/page";

describe("Portal bootstrap page", () => {
  it("redirects the x-default root to the default locale", () => {
    expect(() => HomePage()).toThrow("NEXT_REDIRECT");
  });
});
