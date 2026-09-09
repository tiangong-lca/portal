"use client";

import { useSyncExternalStore } from "react";

function subscribe(update: () => void) {
  const observer = new MutationObserver(update);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
  return () => observer.disconnect();
}
const readTheme = () => (document.documentElement.classList.contains("dark") ? "dark" : "light");
const serverTheme = () => "light" as const;

/** Observe the existing site preference without adding another theme owner or storage key. */
export function useSiteTheme() {
  return useSyncExternalStore(subscribe, readTheme, serverTheme);
}
