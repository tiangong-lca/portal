import type { ReactNode } from "react";
import "./results-continuation.css";
/** @import import { CatalogPagination } from "@/features/catalog/catalog-pagination"; */
export function CatalogPagination({ children, label }: { children: ReactNode; label: string }) {
  return (
    <nav className="catalog-continuation catalog-pagination" aria-label={label}>
      {children}
    </nav>
  );
}
