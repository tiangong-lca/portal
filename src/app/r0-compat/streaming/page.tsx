import { Suspense } from "react";

import { connection } from "next/server";

async function DeferredEvidence() {
  await new Promise((resolve) => setTimeout(resolve, 100));

  return <p data-r0-stream-complete>Deferred server evidence completed.</p>;
}

export default async function R0StreamingPage() {
  await connection();

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-4 px-6 py-12">
      <h1 className="font-heading text-3xl font-semibold">Streaming probe</h1>
      <p>Shell content is available before the deferred evidence.</p>
      <Suspense fallback={<p data-r0-stream-fallback>Waiting for deferred evidence…</p>}>
        <DeferredEvidence />
      </Suspense>
    </main>
  );
}
