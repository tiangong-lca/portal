"use client";

import { LaptopIcon, MoonIcon, SunIcon } from "lucide-react";
import { useEffect, useSyncExternalStore } from "react";

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
  const preference = useSyncExternalStore<ThemePreference>(
    subscribe,
    getThemeSnapshot,
    () => "system",
  );

  useEffect(() => {
    let stored: string | null = null;
    try {
      stored = localStorage.getItem(storageKey);
    } catch {
      // Theme selection still works when browser persistence is unavailable.
    }
    const initial =
      stored === "light" || stored === "dark" || stored === "system" ? stored : "system";

    applyTheme(initial);

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onSystemThemeChange = () => {
      if (getThemeSnapshot() === "system") applyTheme("system");
    };
    media.addEventListener("change", onSystemThemeChange);

    return () => media.removeEventListener("change", onSystemThemeChange);
  }, []);

  const setTheme = (nextTheme: string) => {
    if (nextTheme !== "light" && nextTheme !== "dark" && nextTheme !== "system") return;
    try {
      localStorage.setItem(storageKey, nextTheme);
    } catch {
      // Applying a theme does not depend on local storage access.
    }
    applyTheme(nextTheme);
  };

  const CurrentIcon =
    preference === "light" ? SunIcon : preference === "dark" ? MoonIcon : LaptopIcon;

  return (
    <>
      <div className="sm:hidden">
        <Select onValueChange={setTheme} value={preference}>
          <SelectTrigger
            aria-label={labels.group}
            className="min-h-11 w-14"
            title={labels[preference]}
          >
            <SelectValue>
              <CurrentIcon aria-hidden="true" />
              <span className="sr-only">{labels[preference]}</span>
            </SelectValue>
          </SelectTrigger>
          <SelectContent position="popper">
            <SelectGroup>
              <SelectItem value="light">{labels.light}</SelectItem>
              <SelectItem value="dark">{labels.dark}</SelectItem>
              <SelectItem value="system">{labels.system}</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
      <ToggleGroup
        aria-label={labels.group}
        className="hidden sm:flex"
        onValueChange={setTheme}
        type="single"
        value={preference}
        variant="outline"
      >
        <ToggleGroupItem
          aria-label={labels.light}
          className="size-[44px] min-h-[44px] min-w-[44px] p-0"
          value="light"
        >
          <SunIcon aria-hidden="true" />
        </ToggleGroupItem>
        <ToggleGroupItem
          aria-label={labels.dark}
          className="size-[44px] min-h-[44px] min-w-[44px] p-0"
          value="dark"
        >
          <MoonIcon aria-hidden="true" />
        </ToggleGroupItem>
        <ToggleGroupItem
          aria-label={labels.system}
          className="size-[44px] min-h-[44px] min-w-[44px] p-0"
          value="system"
        >
          <LaptopIcon aria-hidden="true" />
        </ToggleGroupItem>
      </ToggleGroup>
    </>
  );
}
