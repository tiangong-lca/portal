"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
/** @import import { NavigationRail } from "@/components/shell/navigation-rail"; */
export function NavigationRail({ children }: { children: ReactNode }) {
  const host = useRef<HTMLUListElement>(null);
  const hovered = useRef<Element | null>(null);
  const [pill, setPill] = useState<{ x: number; y: number; width: number; height: number } | null>(
    null,
  );
  const pathname = usePathname();
  const point = (target: Element | null) => {
    const box = host.current?.getBoundingClientRect();
    const rect = target?.getBoundingClientRect();
    if (box && rect)
      setPill({
        x: rect.left - box.left + (host.current?.scrollLeft ?? 0),
        y: rect.top - box.top,
        width: rect.width,
        height: rect.height,
      });
    else setPill(null);
  };
  const reset = () => {
    const focused = document.activeElement;
    point(
      hovered.current ??
        (host.current?.contains(focused) && focused?.tagName === "A"
          ? focused
          : (host.current?.querySelector('a[aria-current="page"]') ?? null)),
    );
  };
  useEffect(() => {
    reset();
    const observer = new ResizeObserver(reset);
    if (host.current) observer.observe(host.current);
    void document.fonts.ready.then(reset);
    return () => observer.disconnect();
  }, [pathname]);
  return (
    <ul
      ref={host}
      className="navigation-rail grid grid-cols-3 gap-1 sm:flex sm:min-w-max sm:items-center"
      onPointerMove={(event) => {
        if (event.pointerType !== "touch") {
          hovered.current = (event.target as Element).closest("a");
          reset();
        }
      }}
      onPointerLeave={() => {
        hovered.current = null;
        reset();
      }}
      onFocusCapture={(event) => point(event.target.closest("a"))}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) reset();
      }}
    >
      <li
        className="navigation-rail-highlight"
        aria-hidden="true"
        style={{
          opacity: pill ? 1 : 0,
          transform: `translate(${pill?.x ?? 0}px,${pill?.y ?? 0}px)`,
          width: pill?.width ?? 0,
          height: pill?.height ?? 0,
        }}
      />
      {children}
    </ul>
  );
}
