import "server-only";

const keyIdPattern = /^[A-Za-z0-9._-]{1,64}$/;
const base64UrlPattern = /^[A-Za-z0-9_-]+$/;

export const r0CompatFunctionPath = "/functions/v1/portal_r0_hmac_verify_v1";

type PortalHmacInput = {
  rawBody: Uint8Array;
  keyId: string;
  secret: string;
  timestamp: number;
  nonce: string;
  method?: "POST";
  functionPath?: typeof r0CompatFunctionPath;
};

type PortalHmacResult = {
  bodyHash: string;
  canonical: string;
  signature: string;
  headers: Record<string, string>;
};

function encodeBase64Url(bytes: Uint8Array): string {
  let binary = "";

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
}

function decodeBase64Url(value: string): Uint8Array<ArrayBuffer> {
  if (!base64UrlPattern.test(value)) {
    throw new Error("Expected unpadded Base64URL");
  }

  const standard = value.replaceAll("-", "+").replaceAll("_", "/");
  const padded = standard.padEnd(Math.ceil(standard.length / 4) * 4, "=");
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
}

export function createPortalNonce(): string {
  return encodeBase64Url(crypto.getRandomValues(new Uint8Array(16)));
}

export async function signPortalHmac({
  rawBody,
  keyId,
  secret,
  timestamp,
  nonce,
  method = "POST",
  functionPath = r0CompatFunctionPath,
}: PortalHmacInput): Promise<PortalHmacResult> {
  if (!keyIdPattern.test(keyId)) {
    throw new Error("Invalid Portal HMAC keyId");
  }

  if (!Number.isSafeInteger(timestamp) || timestamp <= 0) {
    throw new Error("Invalid Portal HMAC timestamp");
  }

  if (decodeBase64Url(nonce).byteLength !== 16) {
    throw new Error("Portal HMAC nonce must contain 128 bits");
  }

  const secretBytes = decodeBase64Url(secret);

  if (secretBytes.byteLength < 32) {
    throw new Error("Portal HMAC secret must contain at least 256 bits");
  }

  const bodyBytes = new Uint8Array(rawBody.byteLength);
  bodyBytes.set(rawBody);
  const bodyHash = encodeBase64Url(
    new Uint8Array(await crypto.subtle.digest("SHA-256", bodyBytes.buffer)),
  );
  const canonical = [
    "portal-hmac-v1",
    keyId,
    String(timestamp),
    nonce,
    method,
    functionPath,
    bodyHash,
  ].join("\n");
  const key = await crypto.subtle.importKey(
    "raw",
    secretBytes.buffer,
    { hash: "SHA-256", name: "HMAC" },
    false,
    ["sign"],
  );
  const canonicalBytes = new TextEncoder().encode(canonical);
  const signature = encodeBase64Url(
    new Uint8Array(await crypto.subtle.sign("HMAC", key, canonicalBytes.buffer)),
  );

  return {
    bodyHash,
    canonical,
    signature,
    headers: {
      "x-portal-body-sha256": bodyHash,
      "x-portal-key-id": keyId,
      "x-portal-nonce": nonce,
      "x-portal-signature": signature,
      "x-portal-timestamp": String(timestamp),
    },
  };
}
