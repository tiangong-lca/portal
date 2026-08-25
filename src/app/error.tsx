"use client";

import { Button } from "@/components/ui/button";

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-4 px-6 py-12">
      <h1 className="font-heading text-3xl font-semibold">页面暂时不可用</h1>
      <p className="text-muted-foreground">请求未能完成。可以重试，或稍后重新访问。</p>
      <Button className="w-fit" onClick={reset} variant="outline">
        重试
      </Button>
    </main>
  );
}
