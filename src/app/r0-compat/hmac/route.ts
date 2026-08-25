import { createPortalNonce, r0CompatFunctionPath, signPortalHmac } from "@/server/r0-compat/hmac";
import { readR0CompatEnvironment } from "@/server/r0-compat/env";

const maximumBodyBytes = 4096;
const upstreamTimeoutMilliseconds = 5000;

function jsonResponse(body: Record<string, unknown>, status: number) {
  return Response.json(body, {
    status,
    headers: {
      "cache-control": "no-store",
    },
  });
}

export async function POST(request: Request) {
  const environment = readR0CompatEnvironment();

  if (!environment.endpoint) {
    return jsonResponse({ code: "r0_hmac_fixture_disabled" }, 503);
  }

  const declaredLength = Number(request.headers.get("content-length") ?? 0);

  if (Number.isFinite(declaredLength) && declaredLength > maximumBodyBytes) {
    return jsonResponse({ code: "body_too_large" }, 413);
  }

  const rawBody = new Uint8Array(await request.arrayBuffer());

  if (rawBody.byteLength > maximumBodyBytes) {
    return jsonResponse({ code: "body_too_large" }, 413);
  }

  const signed = await signPortalHmac({
    rawBody,
    keyId: environment.keyId!,
    secret: environment.secret!,
    timestamp: Math.floor(Date.now() / 1000),
    nonce: createPortalNonce(),
  });
  const target = new URL(r0CompatFunctionPath, environment.endpoint);

  try {
    const response = await fetch(target, {
      method: "POST",
      body: rawBody,
      headers: {
        ...signed.headers,
        apikey: environment.publishableKey!,
        "content-type": request.headers.get("content-type") ?? "application/json",
      },
      cache: "no-store",
      signal: AbortSignal.timeout(upstreamTimeoutMilliseconds),
    });
    const payload = await response.json().catch(() => ({ code: "invalid_upstream_response" }));

    return jsonResponse(
      {
        code: response.ok ? "r0_hmac_fixture_ok" : "r0_hmac_fixture_rejected",
        upstreamStatus: response.status,
        payload,
      },
      response.ok ? 200 : 502,
    );
  } catch {
    return jsonResponse({ code: "r0_hmac_fixture_unavailable" }, 503);
  }
}
