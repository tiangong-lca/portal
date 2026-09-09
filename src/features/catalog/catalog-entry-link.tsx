"use client";
import Link from "next/link";
import type { ComponentProps } from "react";
import { useRouter } from "next/navigation";
export function CatalogEntryLink(
  props: Omit<ComponentProps<typeof Link>, "href"> & { href: string },
) {
  const router = useRouter();
  return (
    <Link
      {...props}
      onNavigate={(event) => {
        if (!document.startViewTransition || matchMedia("(prefers-reduced-motion: reduce)").matches)
          return;
        event.preventDefault();
        const transition = document.startViewTransition(
          () =>
            new Promise<void>((resolve) => {
              const finish = () => {
                observer.disconnect();
                clearTimeout(timeout);
                resolve();
              };
              const observer = new MutationObserver(() => {
                if (
                  document.querySelector("[data-search-view]")?.getAttribute("data-search-view") !==
                  "initial"
                )
                  finish();
              });
              const timeout = window.setTimeout(finish, 1800);
              observer.observe(document.body, {
                subtree: true,
                childList: true,
                attributes: true,
                attributeFilter: ["data-search-view"],
              });
              router.push(props.href, { scroll: false });
            }),
        );
        void transition.ready.catch(() => {});
      }}
    />
  );
}
