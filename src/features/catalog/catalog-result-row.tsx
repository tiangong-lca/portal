import type { ReactNode } from "react";
import "./catalog-result-row.css";

/** Shared result row used by the design reference and live catalog.
 * @import import { CatalogResultRow } from "@/features/catalog/catalog-result-row";
 */
export function CatalogResultRow({
  title,
  tags,
  selection,
  action,
  selected,
  children,
}: {
  title: ReactNode;
  tags?: ReactNode;
  selection?: ReactNode;
  action?: ReactNode;
  selected?: boolean;
  children: ReactNode;
}) {
  return (
    <li className="cr-result" data-selected={selected || undefined}>
      {selection && <div className="cr-record-select">{selection}</div>}
      <article>
        <div className="cr-record-top">
          <div className="cr-record-identity">
            <h3>{title}</h3>
            <span className="cr-record-tags">{tags}</span>
          </div>
          {action}
        </div>
        {children}
      </article>
    </li>
  );
}

/** Shared list boundary for live results and design-reference fixtures. */
/** @import import { CatalogResultList } from "@/features/catalog/catalog-result-row"; */
export function CatalogResultList({ children }: { children: ReactNode }) {
  return <ol className="catalog-result-list">{children}</ol>;
}

/** Authored summary shared by every catalog adapter. */
/** @import import { CatalogResultSummary } from "@/features/catalog/catalog-result-row"; */
export function CatalogResultSummary({ text, query = "" }: { text?: string; query?: string }) {
  if (!text) return null;
  const index = query.trim()
    ? text.toLocaleLowerCase().indexOf(query.trim().toLocaleLowerCase())
    : -1;
  return (
    <p className="cr-match catalog-result-summary">
      {index < 0 ? (
        text
      ) : (
        <>
          {text.slice(0, index)}
          <mark>{text.slice(index, index + query.trim().length)}</mark>
          {text.slice(index + query.trim().length)}
        </>
      )}
    </p>
  );
}
