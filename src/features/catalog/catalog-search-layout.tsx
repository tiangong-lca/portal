import type { ReactNode } from "react";
import "./search-workspace.css";

/** Shared filter/result grid for production and the catalog design reference.
 * @import import { CatalogSearchLayout } from "@/features/catalog/catalog-search-layout";
 */
export function CatalogSearchLayout({ children }: { children: ReactNode }) {
  return <div className="catalog-results-layout catalog-results-layout-full">{children}</div>;
}
