import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/** @import import { Empty } from "@/components/ui/empty"; */
function Empty({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "flex w-full min-w-0 flex-1 flex-col items-center justify-center gap-4 rounded-xl border border-dashed p-6 text-center text-balance",
        className,
      )}
      data-slot="empty"
      {...props}
    />
  );
}

/** @import import { EmptyHeader } from "@/components/ui/empty"; */
function EmptyHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("flex max-w-sm flex-col items-center gap-2", className)}
      data-slot="empty-header"
      {...props}
    />
  );
}

const emptyMediaVariants = cva(
  "mb-2 flex shrink-0 items-center justify-center [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-transparent",
        icon: "bg-muted text-foreground flex size-8 items-center justify-center rounded-lg",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

/** @import import { EmptyMedia } from "@/components/ui/empty"; */
function EmptyMedia({
  className,
  variant = "default",
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof emptyMediaVariants>) {
  return (
    <div
      className={cn(emptyMediaVariants({ variant, className }))}
      data-slot="empty-icon"
      data-variant={variant}
      {...props}
    />
  );
}

/** @import import { EmptyTitle } from "@/components/ui/empty"; */
function EmptyTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("font-heading text-sm font-medium tracking-tight", className)}
      data-slot="empty-title"
      {...props}
    />
  );
}

/** @import import { EmptyDescription } from "@/components/ui/empty"; */
function EmptyDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("text-muted-foreground text-sm/relaxed", className)}
      data-slot="empty-description"
      {...props}
    />
  );
}

/** @import import { EmptyContent } from "@/components/ui/empty"; */
function EmptyContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "flex w-full max-w-sm min-w-0 flex-col items-center gap-2.5 text-sm text-balance",
        className,
      )}
      data-slot="empty-content"
      {...props}
    />
  );
}

export { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle };
