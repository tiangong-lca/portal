import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

function ActionGroup({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="action-group"
      className={cn(
        "grid grid-cols-2 items-stretch gap-2 sm:flex sm:flex-wrap [&>*]:min-w-0",
        className,
      )}
      {...props}
    />
  );
}

export { ActionGroup };
