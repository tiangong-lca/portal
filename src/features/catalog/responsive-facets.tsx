"use client";

import { FilterIcon } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export function ResponsiveFacets({
  children,
  labels,
}: {
  children: ReactNode;
  labels: { title: string; description: string; close: string };
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <div className="portal-facets-trigger xl:hidden">
        <Sheet onOpenChange={setOpen} open={open}>
          <SheetTrigger asChild>
            <Button className="min-h-11" variant="outline">
              <FilterIcon data-icon="inline-start" />
              {labels.title}
            </Button>
          </SheetTrigger>
          <SheetContent closeLabel={labels.close} side="left">
            <SheetHeader>
              <SheetTitle>{labels.title}</SheetTitle>
              <SheetDescription>{labels.description}</SheetDescription>
            </SheetHeader>
            {/* Delegation observes native anchor clicks, including keyboard activation; the container is not itself interactive. */}
            {/* oxlint-disable jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
            <div
              className="overflow-y-auto px-4 pb-6 [&_[data-facet-intro]]:hidden"
              onClick={(event) => {
                if ((event.target as HTMLElement).closest("a[href]")) setOpen(false);
              }}
            >
              {children}
            </div>
            {/* oxlint-enable jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
          </SheetContent>
        </Sheet>
      </div>
      <aside aria-label={labels.title} className="portal-facets-content hidden xl:block">
        {children}
      </aside>
      <noscript>
        <style>{".portal-facets-content{display:block}.portal-facets-trigger{display:none}"}</style>
      </noscript>
    </>
  );
}
