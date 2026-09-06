"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Toggle as TogglePrimitive } from "radix-ui";

import { cn } from "@/lib/utils";

const toggleVariants = cva(
  "inline-flex items-center justify-center gap-1 rounded-lg border border-transparent text-sm font-medium whitespace-normal transition-all outline-none hover:bg-muted focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 data-[state=on]:border-primary data-[state=on]:bg-primary-subtle data-[state=on]:text-link data-[state=on]:underline data-[state=on]:decoration-2 data-[state=on]:underline-offset-4 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-transparent",
        outline: "border-input bg-transparent",
      },
      size: {
        default: "min-h-11 min-w-11 px-3 py-2",
        sm: "min-h-8 min-w-8 px-2 py-1 text-xs",
      },
    },
    defaultVariants: {
      size: "default",
      variant: "default",
    },
  },
);

function Toggle({
  className,
  size = "default",
  variant = "default",
  ...props
}: React.ComponentProps<typeof TogglePrimitive.Root> & VariantProps<typeof toggleVariants>) {
  return (
    <TogglePrimitive.Root
      className={cn(toggleVariants({ className, size, variant }))}
      data-slot="toggle"
      {...props}
    />
  );
}

export { Toggle, toggleVariants };
