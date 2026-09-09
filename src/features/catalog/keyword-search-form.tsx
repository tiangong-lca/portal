"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";

/** Native GET remains the no-JavaScript fallback; client navigation preserves selected versions.
 * @import import { KeywordSearchForm } from "@/features/catalog/keyword-search-form";
 */
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
        const href = `${action}?${parameters.toString()}`;
        const query = parameters.get("q")?.trim() ?? "";
        const current = document.querySelector<HTMLElement>("[data-search-query]");
        if (
          !document.startViewTransition ||
          matchMedia("(prefers-reduced-motion: reduce)").matches ||
          !current ||
          current.dataset.searchQuery === query
        ) {
          router.push(href);
          return;
        }
        const transition = document.startViewTransition(
          () =>
            new Promise<void>((resolve) => {
              // Next navigation commits asynchronously. Capture the destination only after
              // the server-rendered query marker changes, preserving client selection state.
              const observer = new MutationObserver(() => {
                if (
                  document.querySelector<HTMLElement>("[data-search-query]")?.dataset
                    .searchQuery === query
                )
                  finish();
              });
              const finish = () => {
                observer.disconnect();
                clearTimeout(timeout);
                resolve();
              };
              const timeout = window.setTimeout(finish, 1500);
              observer.observe(document.body, {
                subtree: true,
                childList: true,
                attributes: true,
                attributeFilter: ["data-search-query"],
              });
              router.push(href);
            }),
        );
        void transition.ready.catch(() => {
          /* Navigation still succeeds if snapshots are unavailable. */
        });
      }}
    >
      {children}
    </form>
  );
}
