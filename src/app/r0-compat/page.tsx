import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { readR0CompatEnvironment } from "@/server/r0-compat/env";

const probes = [
  ["SSR runtime", "/r0-compat/ssr"],
  ["ISR", "/r0-compat/isr"],
  ["Streaming", "/r0-compat/streaming"],
  ["Image optimization", "/r0-compat/image"],
  ["Route Handler", "/r0-compat/route-handler"],
] as const;

export default function R0CompatibilityPage() {
  const environment = readR0CompatEnvironment();

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col gap-8 px-6 py-12">
      <header className="flex flex-col gap-3">
        <Badge className="w-fit" variant="outline">
          {environment.deploymentEnvironment}
        </Badge>
        <h1 className="font-heading text-3xl font-semibold">R0 compatibility matrix</h1>
        <p className="text-muted-foreground">
          Non-public probes for deployment {environment.deploymentSha}. Every page is noindex and
          contains no credential value.
        </p>
      </header>

      <section aria-label="Compatibility probes" className="grid gap-4 sm:grid-cols-2">
        {probes.map(([label, href]) => (
          <Card key={href} size="sm">
            <CardHeader>
              <CardTitle>
                <Link className="underline-offset-4 hover:underline" href={href}>
                  {label}
                </Link>
              </CardTitle>
              <CardDescription>{href}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </section>
    </main>
  );
}
