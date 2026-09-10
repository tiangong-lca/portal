import { Children, type ReactNode } from "react";
import "./results-continuation.css";
/** @import import { CatalogPagination } from "@/features/catalog/catalog-pagination"; */
export function CatalogPagination({ children, label }: { children: ReactNode; label: string }) {
  const paired = Children.count(children) > 1;
  return (
    <nav
      className={[
        "catalog-continuation",
        "catalog-pagination",
        paired ? "catalog-pagination-paired" : null,
      ]
        .filter(Boolean)
        .join(" ")}
      aria-label={label}
    >
      {children}
    </nav>
  );
}
