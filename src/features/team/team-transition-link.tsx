"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ComponentProps } from "react";
import "./team-transition.css";

/** Wait for the destination portrait before taking the second navigation snapshot. */
export function TeamTransitionLink(
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
        if (document.documentElement.hasAttribute("data-team-transition")) return;
        document.documentElement.setAttribute("data-team-transition", "");
        const transition = document.startViewTransition(
          () =>
            new Promise<void>((resolve) => {
              let done = false;
              let decoding = false;
              const finish = () => {
                if (done) return;
                done = true;
                observer.disconnect();
                clearTimeout(timeout);
                resolve();
              };
              const inspect = () => {
                const portraits = document.querySelectorAll<HTMLImageElement>(
                  ".team-page [data-team-transition-target] img",
                );
                if (portraits.length !== 6 || decoding) return;
                decoding = true;
                void Promise.allSettled(
                  Array.from(portraits, (portrait) => portrait.decode()),
                ).then(() => {
                  if (done) return;
                  window.scrollTo({ top: 0, behavior: "instant" });
                  finish();
                });
              };
              const observer = new MutationObserver(inspect);
              const timeout = window.setTimeout(() => {
                transition.skipTransition();
                finish();
              }, 2500);
              observer.observe(document.body, { childList: true, subtree: true });
              router.push(props.href);
              inspect();
            }),
        );
        const cleanup = () => document.documentElement.removeAttribute("data-team-transition");
        void transition.ready.catch(() => {});
        void transition.finished.then(cleanup, cleanup);
      }}
    />
  );
}
