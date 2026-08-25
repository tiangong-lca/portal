import { connection } from "next/server";

import { readR0CompatEnvironment } from "@/server/r0-compat/env";

export default async function R0SsrPage() {
  await connection();
  const environment = readR0CompatEnvironment();

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-4 px-6 py-12">
      <h1 className="font-heading text-3xl font-semibold">SSR runtime probe</h1>
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 font-mono text-sm">
        <dt>process.version</dt>
        <dd data-r0-runtime-version>{process.version}</dd>
        <dt>environment</dt>
        <dd>{environment.deploymentEnvironment}</dd>
        <dt>deployment</dt>
        <dd>{environment.deploymentSha}</dd>
      </dl>
    </main>
  );
}
