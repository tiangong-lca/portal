import { createPortalHybridPostHandler } from "@/server/hybrid/handler";

const handler = createPortalHybridPostHandler();

export function POST(request: Request) {
  return handler(request);
}
