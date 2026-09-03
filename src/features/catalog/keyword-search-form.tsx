"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";

/** Native GET remains the no-JavaScript fallback; client navigation preserves selected versions. */
export function KeywordSearchForm({ action, children }: { action: string; children: ReactNode }) {
  const router = useRouter();
  return (
    <form
      action={action}
      className="flex flex-col gap-2"
      method="get"
      onSubmit={(event) => {
        event.preventDefault();
        const parameters = new URLSearchParams();
        for (const [key, value] of new FormData(event.currentTarget))
          if (typeof value === "string") parameters.append(key, value);
        router.push(`${action}?${parameters.toString()}`);
      }}
    >
      {children}
    </form>
  );
}
