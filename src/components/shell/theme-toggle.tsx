"use client";

import { LaptopIcon, MoonIcon, SunIcon } from "lucide-react";
import { useEffect, useSyncExternalStore } from "react";

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

type ThemePreference = "light" | "dark" | "system";

const storageKey = "tiangong.portal.theme.v1";

type ThemeToggleProps = {
  labels: Record<ThemePreference, string> & { group: string };
};

function applyTheme(preference: ThemePreference) {
  const isDark =
    preference === "dark" ||
    (preference === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);

  document.documentElement.classList.toggle("dark", isDark);
  document.documentElement.dataset.theme = preference;
  window.dispatchEvent(new Event("portal-theme-change"));
}

function subscribe(onStoreChange: () => void) {
  window.addEventListener("portal-theme-change", onStoreChange);
  return () => window.removeEventListener("portal-theme-change", onStoreChange);
}

function getThemeSnapshot(): ThemePreference {
  const value = document.documentElement.dataset.theme;
  return value === "light" || value === "dark" || value === "system" ? value : "system";
}

export function ThemeToggle({ labels }: ThemeToggleProps) {
  const preference = useSyncExternalStore(subscribe, getThemeSnapshot, () => "system");

  useEffect(() => {
    const stored = localStorage.getItem(storageKey);
    const initial =
      stored === "light" || stored === "dark" || stored === "system" ? stored : "system";

    applyTheme(initial);

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onSystemThemeChange = () => {
      if ((localStorage.getItem(storageKey) ?? "system") === "system") applyTheme("system");
    };
    media.addEventListener("change", onSystemThemeChange);

    return () => media.removeEventListener("change", onSystemThemeChange);
  }, []);

  const setTheme = (nextTheme: string) => {
    if (nextTheme !== "light" && nextTheme !== "dark" && nextTheme !== "system") return;
    localStorage.setItem(storageKey, nextTheme);
    applyTheme(nextTheme);
  };

  return (
    <ToggleGroup
      aria-label={labels.group}
      onValueChange={setTheme}
      type="single"
      value={preference}
      variant="outline"
    >
      <ToggleGroupItem
        aria-label={labels.light}
        className="min-h-[44px] min-w-[44px]"
        value="light"
      >
        <SunIcon aria-hidden="true" />
      </ToggleGroupItem>
      <ToggleGroupItem aria-label={labels.dark} className="min-h-[44px] min-w-[44px]" value="dark">
        <MoonIcon aria-hidden="true" />
      </ToggleGroupItem>
      <ToggleGroupItem
        aria-label={labels.system}
        className="min-h-[44px] min-w-[44px]"
        value="system"
      >
        <LaptopIcon aria-hidden="true" />
      </ToggleGroupItem>
    </ToggleGroup>
  );
}
