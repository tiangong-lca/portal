import { createPortalHybridPostHandler } from "@/server/hybrid/handler";

// Natural-language input stays in a bounded same-origin POST body, never a URL or cache key.
const handler = createPortalHybridPostHandler({ lexicalOnly: true });

export function POST(request: Request) {
  return handler(request);
}
