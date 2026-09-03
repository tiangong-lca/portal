"use client";

import { useEffect, useRef, type ReactNode } from "react";

/** Native disclosure stays usable without JavaScript; same-page actions open it before scrolling. */
export function HashDisclosure({
  id,
  label,
  children,
}: {
  id: string;
  label: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    const showTarget = () => {
      if (window.location.hash === `#${id}` && ref.current) ref.current.open = true;
    };
    const onClick = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      )
        return;
      const link = event.target instanceof Element ? event.target.closest("a") : null;
      if (link?.getAttribute("href") === `#${id}` && ref.current) ref.current.open = true;
    };
    showTarget();
    window.addEventListener("hashchange", showTarget);
    document.addEventListener("click", onClick);
    return () => {
      window.removeEventListener("hashchange", showTarget);
      document.removeEventListener("click", onClick);
    };
  }, [id]);
  return (
    <details className="rounded-xl border p-3" id={id} ref={ref}>
      <summary className="cursor-pointer font-medium">{label}</summary>
      <div className="mt-4">{children}</div>
    </details>
  );
}
