import { BookmarkIcon, XIcon } from "lucide-react";
import { Button } from "../../src/components/ui/button";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from "../../src/components/ui/empty";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableCaption,
} from "../../src/components/ui/table";
import { DatasetVersionTag } from "../../src/features/catalog/dataset-tags";
import type { ReferenceDataset } from "./data";
import { Metadata, type ReferenceLabels } from "./shared";

/** Shortlist content for the reference drawer, preserving exact versions and full names.
 * @import import { ReferenceShortlist } from '../catalog-reference/panels';
 */
export function ReferenceShortlist({
  records,
  labels: m,
  onOpen,
  onRemove,
  onContinue,
}: {
  records: ReferenceDataset[];
  labels: ReferenceLabels;
  onOpen: (ref: string) => void;
  onRemove: (ref: string) => void;
  onContinue: () => void;
}) {
  return (
    <div className="cr-panel-body">
      {records.length ? (
        <ol className="cr-saved-list">
          {records.map((item) => (
            <li key={item.ref} className="cr-saved-item">
              <div className="cr-saved-heading">
                <h3>
                  <a
                    href={`#catalog-record-${item.ref}`}
                    onClick={(event) => {
                      event.preventDefault();
                      onOpen(item.ref);
                    }}
                  >
                    {item.name}
                  </a>
                </h3>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`${m.CatalogReference.unsave}: ${item.name}`}
                  onClick={() => onRemove(item.ref)}
                >
                  <XIcon aria-hidden="true" />
                </Button>
              </div>
              <DatasetVersionTag version={item.ref.split("@")[1]!} label={m.Search.version} />
              <Metadata record={item} labels={m} />
            </li>
          ))}
        </ol>
      ) : (
        <Empty className="cr-shortlist-empty">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <BookmarkIcon aria-hidden="true" />
            </EmptyMedia>
            <EmptyTitle>{m.Common.collections}</EmptyTitle>
            <EmptyDescription>{m.CatalogReference.shortlistEmpty}</EmptyDescription>
          </EmptyHeader>
          <Button variant="outline" onClick={onContinue}>
            {m.CatalogReference.back}
          </Button>
        </Empty>
      )}
    </div>
  );
}

/** Field-aligned comparison reference; values do not establish scientific comparability.
 * @import import { ReferenceComparison } from '../catalog-reference/panels';
 */
export function ReferenceComparison({
  records,
  labels: m,
  onOpen,
}: {
  records: ReferenceDataset[];
  labels: ReferenceLabels;
  onOpen: (ref: string) => void;
}) {
  const fields: {
    label: string;
    technical?: boolean;
    value: (r: ReferenceDataset) => string | undefined;
  }[] = [
    { label: m.Detail.referenceProduct, value: (r) => r.product },
    { label: m.Detail.functionalUnit, value: (r) => r.unit },
    { label: m.Detail.geography, value: (r) => r.geography },
    { label: m.Detail.referenceYear, value: (r) => r.year },
    { label: m.Detail.technology, value: (r) => r.technology },
    {
      label: m.CatalogReference.publicContent,
      value: (r) =>
        r.open ? m.CatalogReference.availabilityExchanges : m.CatalogReference.availabilityMetadata,
    },
    { label: "UUID", technical: true, value: (r) => r.ref.split("@")[0] },
  ];
  const title = (r: ReferenceDataset, index: number) => (
    <div className="cr-compare-candidate">
      <span className="cr-candidate-number" aria-hidden="true">
        {index + 1}
      </span>
      <div>
        <a
          href={`#catalog-record-${r.ref}`}
          onClick={(event) => {
            event.preventDefault();
            onOpen(r.ref);
          }}
        >
          {r.name}
        </a>
        <span className="cr-compare-version">
          <span className="sr-only">{m.Search.version}: </span>v{r.ref.split("@")[1]}
        </span>
      </div>
    </div>
  );
  return (
    <div className="cr-comparison-body">
      <div className="cr-compare-desktop">
        <Table className="cr-comparison-table">
          <TableCaption className="sr-only">{m.CatalogReference.compare}</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead scope="col">{m.Detail.context}</TableHead>
              {records.map((r, i) => (
                <TableHead key={r.ref} scope="col">
                  {title(r, i)}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {fields.map((field) => (
              <TableRow key={field.label}>
                <TableHead scope="row">{field.label}</TableHead>
                {records.map((r) => (
                  <TableCell key={r.ref}>
                    {field.technical ? (
                      <code className="cr-compare-uuid">{field.value(r)}</code>
                    ) : (
                      (field.value(r) ?? m.Common.notProvided)
                    )}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <div className="cr-compare-mobile">
        <ol className="cr-compare-candidates">
          {records.map((r, i) => (
            <li key={r.ref}>{title(r, i)}</li>
          ))}
        </ol>
        {fields.map((field) => (
          <section key={field.label} className="cr-compare-field">
            <h3>{field.label}</h3>
            <dl>
              {records.map((r, i) => (
                <div key={r.ref}>
                  <dt>
                    <span aria-hidden="true">{i + 1}</span>
                    <span className="sr-only">{r.name}</span>
                  </dt>
                  <dd>
                    {field.technical ? (
                      <code className="cr-compare-uuid">{field.value(r)}</code>
                    ) : (
                      (field.value(r) ?? m.Common.notProvided)
                    )}
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        ))}
      </div>
    </div>
  );
}
