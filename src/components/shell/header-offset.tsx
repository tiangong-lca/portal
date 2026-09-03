"use client";

import { useEffect } from "react";

/** Keep fragment navigation and keyboard scrolling clear of the actual header. */
export function HeaderOffset() {
  useEffect(() => {
    const header = document.querySelector<HTMLElement>("[data-portal-header]");
    if (!header) return;
    const measure = () => {
      const height = Math.ceil(header.getBoundingClientRect().height);
      if (height > 0) {
        document.documentElement.style.setProperty("--portal-header-height", `${height}px`);
      }
    };
    measure();
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(measure);
    observer?.observe(header);
    window.addEventListener("resize", measure);
    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", measure);
      document.documentElement.style.removeProperty("--portal-header-height");
    };
  }, []);
  return null;
}
