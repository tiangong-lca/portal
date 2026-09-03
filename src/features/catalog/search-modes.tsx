"use client";

import { useState, useSyncExternalStore, type ReactNode } from "react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";

function subscribe(callback: () => void) {
  window.addEventListener("hashchange", callback);
  return () => window.removeEventListener("hashchange", callback);
}
function isSharedDescription() {
  return window.location.hash.startsWith("#hybrid=");
}

export function SearchModes({
  keyword,
  description,
  labels,
}: {
  keyword: ReactNode;
  description: ReactNode;
  labels: { mode: string; keyword: string; description: string };
}) {
  const [choice, setChoice] = useState<"keyword" | "description" | null>(null);
  const sharedDescription = useSyncExternalStore(subscribe, isSharedDescription, () => false);
  const mode = choice ?? (sharedDescription ? "description" : "keyword");
  return (
    <div className="flex flex-col gap-6">
      <ToggleGroup
        aria-label={labels.mode}
        onValueChange={(value) => {
          if (value === "keyword" || value === "description") setChoice(value);
        }}
        type="single"
        value={mode}
        variant="outline"
      >
        <ToggleGroupItem className="h-auto min-h-11 whitespace-normal" value="keyword">
          {labels.keyword}
        </ToggleGroupItem>
        <ToggleGroupItem className="h-auto min-h-11 whitespace-normal" value="description">
          {labels.description}
        </ToggleGroupItem>
      </ToggleGroup>
      <div
        hidden={mode !== "keyword"}
        className={cn("flex flex-col gap-6", mode !== "keyword" && "hidden")}
      >
        {keyword}
      </div>
      <div hidden={mode !== "description"} className={cn(mode !== "description" && "hidden")}>
        {description}
      </div>
    </div>
  );
}
