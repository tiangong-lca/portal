import {
  ArrowLeftIcon,
  ArrowUpRightIcon,
  BookmarkIcon,
  CheckIcon,
  CopyIcon,
  FileTextIcon,
  GitCompareArrowsIcon,
  InfoIcon,
} from "lucide-react";
import { Button } from "../../src/components/ui/button";
import { Alert, AlertDescription } from "../../src/components/ui/alert";
import { referenceCitation, type ReferenceDataset } from "./data";
import { Availability, Metadata, type ReferenceLabels } from "./shared";
import type { PortalLocale } from "../../src/i18n/routing";

export type DetailReferenceProps = {
  record: ReferenceDataset;
  labels: ReferenceLabels;
  locale: PortalLocale;
  selected: boolean;
  selectionFull: boolean;
  saved: boolean;
  copyStatus: string;
  onBack: () => void;
  onSelect: () => void;
  onSave: () => void;
  onCopy: () => void;
};

/** Complete dataset-detail design reference. Authored fixture values are preserved without scientific inference.
 * @import import { DetailReference } from '../catalog-reference/detail-page';
 */
export function DetailReference({
  record,
  labels: m,
  locale,
  selected,
  selectionFull,
  saved,
  copyStatus,
  onBack,
  onSelect,
  onSave,
  onCopy,
}: DetailReferenceProps) {
  const d = m.Detail;
  const r = m.CatalogReference;
  const missing = m.Common.notProvided;
  const sections = [
    ["overview", d.overview],
    ["scope", d.method],
    ["exchanges", d.exchanges],
    ["evidence", r.reviewScope],
    ["citation", d.citation],
  ];
  return (
    <>
      <div className="cr-detail-heading">
        <Button variant="ghost" size="sm" onClick={onBack} className="cr-back">
          <ArrowLeftIcon aria-hidden="true" />
          {r.back}
        </Button>
        <div className="cr-detail-eyebrow">
          <span>{d.processTitle}</span>
          <span>{r.sampleSource}</span>
          <Availability record={record} labels={m} />
        </div>
        <div className="cr-detail-title">
          <h1>{record.name}</h1>
        </div>
        <p className="cr-detail-lead">{record.description}</p>
        <div className="cr-detail-actions">
          <Button
            size="sm"
            onClick={onSave}
            variant={saved ? "secondary" : "default"}
            aria-pressed={saved}
          >
            {saved ? <CheckIcon aria-hidden="true" /> : <BookmarkIcon aria-hidden="true" />}
            {saved ? r.saved : d.collect}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onSelect}
            aria-pressed={selected}
            disabled={selectionFull && !selected}
          >
            {selected ? (
              <CheckIcon aria-hidden="true" />
            ) : (
              <GitCompareArrowsIcon aria-hidden="true" />
            )}
            {selected ? m.Compare.removeSelection : d.compare}
          </Button>
        </div>
      </div>
      <section className="cr-applicability" aria-label={r.applicability}>
        <Metadata record={record} labels={m} expanded />
      </section>
      <nav className="cr-section-nav" aria-label={d.processTitle}>
        {sections.map(([id, label]) => (
          <a key={id} href={`#cr-${id}`}>
            {label}
          </a>
        ))}
      </nav>
      <div className="cr-detail-layout">
        <div className="cr-detail-content">
          <section id="cr-overview" className="cr-detail-section">
            <div className="cr-section-heading">
              <span aria-hidden="true">01</span>
              <h2>{r.about}</h2>
            </div>
            <p className="cr-prose">{record.background ?? record.description}</p>
            <div className="cr-technology">
              <FileTextIcon aria-hidden="true" />
              <div>
                <h3>{d.technology}</h3>
                <p>{record.technology ?? missing}</p>
              </div>
            </div>
          </section>
          <section id="cr-scope" className="cr-detail-section">
            <div className="cr-section-heading">
              <span aria-hidden="true">02</span>
              <h2>{d.method}</h2>
            </div>
            <dl className="cr-scope">
              <div>
                <dt>{r.boundary}</dt>
                <dd>{record.technology ?? missing}</dd>
              </div>
              <div>
                <dt>{r.included}</dt>
                <dd>{record.included ?? missing}</dd>
              </div>
              <div>
                <dt>{r.excluded}</dt>
                <dd>{record.excluded ?? missing}</dd>
              </div>
              <div>
                <dt>{d.allocationModeling}</dt>
                <dd>{missing}</dd>
              </div>
            </dl>
          </section>
          <section id="cr-exchanges" className="cr-detail-section">
            <div className="cr-section-heading">
              <span aria-hidden="true">03</span>
              <h2>{d.exchanges}</h2>
            </div>
            {record.open && record.exchanges.length > 0 ? (
              <>
                <p className="cr-section-note">
                  {d.functionalUnit}: <strong className="cr-mono">{record.unit}</strong>
                </p>
                <dl className="cr-exchange-reference">
                  {record.exchanges.map((exchange) => (
                    <div key={`${exchange.direction}-${exchange.name}`}>
                      <dt>
                        <span className="cr-direction">
                          {exchange.direction === "input" ? r.input : r.output}
                        </span>
                        {exchange.name}
                      </dt>
                      <dd>
                        <strong>
                          {exchange.amount} {exchange.unit}
                        </strong>
                        {exchange.reference && <span>{d.quantitativeReference}</span>}
                      </dd>
                    </div>
                  ))}
                </dl>
                <p className="cr-section-note">{d.exchangesDescription}</p>
              </>
            ) : (
              <Alert>
                <InfoIcon aria-hidden="true" />
                <AlertDescription>{d.exchangesEmpty}</AlertDescription>
              </Alert>
            )}
            <details className="cr-disclosure">
              <summary>{r.exactIdentity}</summary>
              <dl className="cr-identity">
                <dt>{m.Common.exactVersion}</dt>
                <dd>{record.ref}</dd>
                <dt>{d.functionalUnit}</dt>
                <dd>{record.unit ?? missing}</dd>
              </dl>
            </details>
          </section>
          <section id="cr-evidence" className="cr-detail-section">
            <div className="cr-section-heading">
              <span aria-hidden="true">04</span>
              <h2>{r.reviewScope}</h2>
            </div>
            <div className="cr-evidence-grid">
              <div>
                <h3>{d.quality}</h3>
                <p>{r.noReview}</p>
                <p className="cr-section-note">{d.qualityEmpty}</p>
              </div>
              <div>
                <h3>{d.lcia}</h3>
                <p>{d.lciaUnavailable}</p>
              </div>
            </div>
          </section>
          <section id="cr-citation" className="cr-detail-section">
            <div className="cr-section-heading">
              <span aria-hidden="true">05</span>
              <h2>{d.citation}</h2>
            </div>
            <p className="cr-section-note">{r.citationHint}</p>
            <blockquote className="cr-citation">{referenceCitation(record, locale)}</blockquote>
            <div className="cr-copy-action">
              <Button variant="outline" onClick={onCopy}>
                <CopyIcon aria-hidden="true" />
                {d.copyCitation}
              </Button>
              <output>{copyStatus}</output>
            </div>
          </section>
        </div>
        <aside className="cr-detail-aside" aria-label={r.checkBeforeUse}>
          <div className="cr-guidance">
            <div className="cr-aside-heading">
              <InfoIcon aria-hidden="true" />
              <h2>{r.checkBeforeUse}</h2>
            </div>
            <p>{r.evidenceNote}</p>
            <a
              href={`https://portal.tiangong.earth/${locale}/methodology`}
              target="_blank"
              rel="noreferrer"
            >
              {m.Common.methodology}
              <ArrowUpRightIcon aria-hidden="true" />
            </a>
          </div>
          <section className="cr-source">
            <h2>{r.sourceAndVersion}</h2>
            <dl>
              <div>
                <dt>{d.sourceDatabase}</dt>
                <dd>{r.sampleSource}</dd>
              </div>
              <div>
                <dt>{d.license}</dt>
                <dd>{r.sampleLicense}</dd>
              </div>
              <div>
                <dt>{m.Search.version}</dt>
                <dd className="cr-mono">{record.ref.split("@")[1]}</dd>
              </div>
              <div>
                <dt>{r.exactIdentity}</dt>
                <dd className="cr-mono cr-wrap">{record.ref}</dd>
              </div>
            </dl>
          </section>
        </aside>
      </div>
    </>
  );
}
