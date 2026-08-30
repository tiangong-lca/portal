"use client";

import { LinkIcon, ScanSearchIcon, ShieldAlertIcon, XIcon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { mapHybridItem, mapSearchItem } from "@/features/catalog/map-public-data";
import { SearchResults, type SearchResultLabels } from "@/features/catalog/search-results";
import {
  decodeHybridQueryFragment,
  encodeHybridQueryFragment,
} from "@/features/catalog/hybrid-share";
import {
  portalHybridSearchRequestSchema,
  type PortalHybridFilters,
  type PortalHybridSearchRequest,
} from "@/lib/hybrid-request";
import { localePath, type PortalLocale } from "@/i18n/routing";
import type { PortalHybridBffResponse } from "@/server/hybrid/contracts";

type HybridSearchLabels = {
  advisoryDescription: string;
  advisoryTitle: string;
  compareSelected: string;
  description: string;
  emptyDescription: string;
  emptyTitle: string;
  error: string;
  fallbackDescription: string;
  fallbackTitle: string;
  flow: string;
  kind: string;
  privacy: string;
  process: string;
  queryLabel: string;
  queryPlaceholder: string;
  resultsTitle: string;
  running: string;
  semanticQuery: string;
  shareCancel: string;
  shareConfirm: string;
  shareDisclosure: string;
  sharePreview: string;
  shareQuery: string;
  shared: string;
  submit: string;
  terms: string;
  title: string;
};

type RequestState = {
  filters: PortalHybridFilters;
  kind: "process" | "flow";
  query: string;
};

function isBffResponse(value: unknown): value is PortalHybridBffResponse {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  return (
    record.schemaVersion === "portal.hybrid-bff.v1" &&
    (record.mode === "hybrid" || record.mode === "lexical_fallback") &&
    (record.kind === "process" || record.kind === "flow") &&
    Array.isArray(record.items)
  );
}

function shareRequest(state: RequestState): PortalHybridSearchRequest {
  return portalHybridSearchRequestSchema.parse({
    schemaVersion: "portal.hybrid-search-request.v1",
    kind: state.kind,
    query: state.query,
    filters:
      state.kind === "flow" ? { ...state.filters, processSubtype: undefined } : state.filters,
    limit: 10,
  });
}

export function HybridSearchPanel({
  initialFilters,
  initialKind,
  labels,
  locale,
  resultLabels,
  siteOrigin,
}: {
  initialFilters: PortalHybridFilters;
  initialKind: "process" | "flow";
  labels: HybridSearchLabels;
  locale: PortalLocale;
  resultLabels: SearchResultLabels;
  siteOrigin: string;
}) {
  const [requestState, setRequestState] = useState<RequestState>({
    filters: initialFilters,
    kind: initialKind,
    query: "",
  });
  const [response, setResponse] = useState<PortalHybridBffResponse | null>(null);
  const [message, setMessage] = useState("");
  const [running, setRunning] = useState(false);
  const [sharePreview, setSharePreview] = useState(false);

  useEffect(() => {
    if (!window.location.hash.startsWith("#hybrid=")) return;
    try {
      const request = decodeHybridQueryFragment(window.location.hash);
      // oxlint-disable-next-line react-hooks/set-state-in-effect -- A fragment is browser-only input and never auto-submits.
      setRequestState({ filters: request.filters, kind: request.kind, query: request.query });
    } catch {
      // oxlint-disable-next-line react-hooks/set-state-in-effect -- Invalid shared input is reported locally.
      setMessage(labels.error);
    }
  }, [labels.error]);

  const parsedRequest = useMemo(() => {
    const parsed = portalHybridSearchRequestSchema.safeParse({
      schemaVersion: "portal.hybrid-search-request.v1",
      kind: requestState.kind,
      query: requestState.query,
      filters:
        requestState.kind === "flow"
          ? { ...requestState.filters, processSubtype: undefined }
          : requestState.filters,
      limit: 10,
    });
    return parsed.success ? parsed.data : null;
  }, [requestState]);

  const results = useMemo(() => {
    if (!response) return [];
    return response.mode === "hybrid"
      ? response.items.map((item) => mapHybridItem(item, locale))
      : response.items.map((item) => mapSearchItem(item, locale));
  }, [locale, response]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h2>{labels.title}</h2>
        </CardTitle>
        <CardDescription>{labels.description}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <form
          className="flex flex-col gap-4"
          onSubmit={async (event) => {
            event.preventDefault();
            if (!parsedRequest) {
              setMessage(labels.error);
              return;
            }
            setRunning(true);
            setMessage("");
            setResponse(null);
            setSharePreview(false);
            try {
              const result = await fetch("/internal/hybrid", {
                method: "POST",
                body: JSON.stringify(parsedRequest),
                headers: { "content-type": "application/json" },
                cache: "no-store",
                redirect: "error",
              });
              const payload = (await result.json()) as unknown;
              if (!result.ok || !isBffResponse(payload)) throw new Error("hybrid_response_invalid");
              setResponse(payload);
            } catch {
              setMessage(labels.error);
            } finally {
              setRunning(false);
            }
          }}
        >
          <Field>
            <FieldLabel>{labels.kind}</FieldLabel>
            <ToggleGroup
              aria-label={labels.kind}
              onValueChange={(kind) => {
                if (kind === "process" || kind === "flow") {
                  setRequestState((current) => ({ ...current, kind }));
                }
              }}
              type="single"
              value={requestState.kind}
              variant="outline"
            >
              <ToggleGroupItem className="min-h-11" value="process">
                {labels.process}
              </ToggleGroupItem>
              <ToggleGroupItem className="min-h-11" value="flow">
                {labels.flow}
              </ToggleGroupItem>
            </ToggleGroup>
          </Field>
          <Field>
            <FieldLabel htmlFor="hybrid-query">{labels.queryLabel}</FieldLabel>
            <Textarea
              id="hybrid-query"
              maxLength={512}
              onChange={(event) =>
                setRequestState((current) => ({ ...current, query: event.target.value }))
              }
              placeholder={labels.queryPlaceholder}
              rows={3}
              value={requestState.query}
            />
            <FieldDescription>{labels.privacy}</FieldDescription>
          </Field>
          <div className="flex flex-wrap gap-2">
            <Button disabled={!parsedRequest || running} type="submit">
              <ScanSearchIcon data-icon="inline-start" />
              {running ? labels.running : labels.submit}
            </Button>
            <Button
              disabled={!parsedRequest}
              onClick={() => setSharePreview(true)}
              type="button"
              variant="outline"
            >
              <LinkIcon data-icon="inline-start" />
              {labels.shareQuery}
            </Button>
          </div>
        </form>

        {sharePreview && parsedRequest ? (
          <Card size="sm">
            <CardHeader>
              <CardTitle>
                <h3>{labels.sharePreview}</h3>
              </CardTitle>
              <CardDescription>{labels.shareDisclosure}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <pre className="bg-muted max-h-64 overflow-auto rounded-lg p-3 text-xs break-words whitespace-pre-wrap">
                {JSON.stringify(parsedRequest, null, 2)}
              </pre>
              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={async () => {
                    try {
                      const fragment = encodeHybridQueryFragment(shareRequest(requestState));
                      const url = `${window.location.origin}${window.location.pathname}${fragment}`;
                      await navigator.clipboard.writeText(url);
                      setMessage(labels.shared);
                      setSharePreview(false);
                    } catch {
                      setMessage(labels.error);
                    }
                  }}
                  type="button"
                >
                  <LinkIcon data-icon="inline-start" />
                  {labels.shareConfirm}
                </Button>
                <Button onClick={() => setSharePreview(false)} type="button" variant="ghost">
                  <XIcon data-icon="inline-start" />
                  {labels.shareCancel}
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : null}

        {response?.mode === "lexical_fallback" ? (
          <Alert>
            <ShieldAlertIcon aria-hidden="true" />
            <AlertTitle>{labels.fallbackTitle}</AlertTitle>
            <AlertDescription>{labels.fallbackDescription}</AlertDescription>
          </Alert>
        ) : null}

        {response?.mode === "hybrid" ? (
          <Card size="sm">
            <CardHeader>
              <CardTitle>
                <h3>{labels.advisoryTitle}</h3>
              </CardTitle>
              <CardDescription>{labels.advisoryDescription}</CardDescription>
            </CardHeader>
            <CardContent>
              <dl className="grid gap-3 sm:grid-cols-2">
                <div>
                  <dt className="text-muted-foreground text-xs font-medium uppercase">
                    {labels.semanticQuery}
                  </dt>
                  <dd>{response.interpretation.semanticQuery}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground text-xs font-medium uppercase">
                    {labels.terms}
                  </dt>
                  <dd className="flex flex-wrap gap-2">
                    {response.interpretation.terms.map((term) => (
                      <Badge key={`${term.language}:${term.value}`} variant="outline">
                        {term.language} · {term.value}
                      </Badge>
                    ))}
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        ) : null}

        {response ? (
          results.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyTitle>{labels.emptyTitle}</EmptyTitle>
                <EmptyDescription>{labels.emptyDescription}</EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <section aria-label={labels.resultsTitle} className="flex flex-col gap-4">
              <h3 className="font-heading text-xl font-semibold">{labels.resultsTitle}</h3>
              <form
                action={localePath(locale, "compare")}
                className="flex flex-col gap-4"
                method="get"
              >
                <input name="v" type="hidden" value="1" />
                <SearchResults
                  items={results}
                  labels={resultLabels}
                  locale={locale}
                  selectable
                  siteOrigin={siteOrigin}
                />
                {results.some((item) => item.kind === "process") ? (
                  <Button className="self-start" type="submit">
                    {labels.compareSelected}
                  </Button>
                ) : null}
              </form>
            </section>
          )
        ) : null}

        <p aria-live="polite" className="text-muted-foreground min-h-5 text-sm">
          {message}
        </p>
      </CardContent>
    </Card>
  );
}
