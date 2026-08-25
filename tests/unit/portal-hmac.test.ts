import { describe, expect, it } from "vitest";

import fixture from "../fixtures/hmac/portal-hmac-v1.json";

import { signPortalHmac } from "@/server/r0-compat/hmac";

describe("portal-hmac-v1 signer", () => {
  it("matches the cross-runtime canonical fixture", async () => {
    const signed = await signPortalHmac({
      rawBody: new TextEncoder().encode(fixture.rawBody),
      keyId: fixture.keyId,
      secret: fixture.secret,
      timestamp: fixture.timestamp,
      nonce: fixture.nonce,
    });

    expect(signed.bodyHash).toBe(fixture.bodyHash);
    expect(signed.canonical).toBe(fixture.canonical);
    expect(signed.signature).toBe(fixture.signature);
    expect(signed.headers["x-portal-signature"]).toBe(fixture.signature);
  });

  it("binds the signature to the raw body bytes", async () => {
    const signed = await signPortalHmac({
      rawBody: new TextEncoder().encode(`${fixture.rawBody} `),
      keyId: fixture.keyId,
      secret: fixture.secret,
      timestamp: fixture.timestamp,
      nonce: fixture.nonce,
    });

    expect(signed.bodyHash).not.toBe(fixture.bodyHash);
    expect(signed.signature).not.toBe(fixture.signature);
  });

  it("rejects weak secrets and non-128-bit nonces", async () => {
    await expect(
      signPortalHmac({
        rawBody: new Uint8Array(),
        keyId: fixture.keyId,
        secret: "c2hvcnQ",
        timestamp: fixture.timestamp,
        nonce: fixture.nonce,
      }),
    ).rejects.toThrow("at least 256 bits");

    await expect(
      signPortalHmac({
        rawBody: new Uint8Array(),
        keyId: fixture.keyId,
        secret: fixture.secret,
        timestamp: fixture.timestamp,
        nonce: "c2hvcnQ",
      }),
    ).rejects.toThrow("128 bits");
  });

  it("rejects non-canonical Base64URL trailing bits", async () => {
    await expect(
      signPortalHmac({
        rawBody: new Uint8Array(),
        keyId: fixture.keyId,
        secret: fixture.secret,
        timestamp: fixture.timestamp,
        nonce: "_____________________x",
      }),
    ).rejects.toThrow("canonical unpadded Base64URL");

    await expect(
      signPortalHmac({
        rawBody: new Uint8Array(),
        keyId: fixture.keyId,
        secret: `${fixture.secret.slice(0, -1)}9`,
        timestamp: fixture.timestamp,
        nonce: fixture.nonce,
      }),
    ).rejects.toThrow("canonical unpadded Base64URL");
  });
});
