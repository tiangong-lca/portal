"use client";

import {
  DownloadIcon,
  EyeIcon,
  LinkIcon,
  PlusIcon,
  Trash2Icon,
  UploadIcon,
  XIcon,
} from "lucide-react";
import { useEffect, useState } from "react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { isExactDatasetRef } from "@/features/catalog/exact-ref";

import {
  collectionsStorageKey,
  decodeDisclosedCollectionFragment,
  decodeCollectionFragment,
  emptyCollectionState,
  encodeDisclosedCollectionFragment,
  encodeCollectionFragment,
  maxCollectionImportBytes,
  parseCollectionJson,
  type CollectionMember,
  type CollectionState,
} from "./storage";

type CollectionLabels = {
  add: string;
  candidate: string;
  clearCorrupt: string;
  downloadCorrupt: string;
  empty: string;
  error: string;
  excluded: string;
  export: string;
  import: string;
  imported: string;
  memberPlaceholder: string;
  memberRef: string;
  note: string;
  purpose: string;
  remove: string;
  researchName: string;
  saved: string;
  selected: string;
  share: string;
  shareCancel: string;
  shareConfirm: string;
  shareDisclosure: string;
  sharePreview: string;
  shareWithNotes: string;
  shared: string;
  sharedWithNotes: string;
};

function mergeRefs(state: CollectionState, refs: string[]): CollectionState {
  const existing = new Set(state.members.map((member) => member.ref));
  return {
    ...state,
    members: [
      ...state.members,
      ...refs
        .filter((ref) => !existing.has(ref))
        .map((ref) => ({ note: "", ref, status: "candidate" as const })),
    ],
  };
}

function mergeDisclosedState(
  current: CollectionState,
  disclosed: CollectionState,
): CollectionState {
  const existing = new Set(current.members.map((member) => member.ref));
  return {
    ...current,
    researchName: current.researchName || disclosed.researchName,
    purpose: current.purpose || disclosed.purpose,
    members: [
      ...current.members,
      ...disclosed.members.filter((member) => !existing.has(member.ref)),
    ],
  };
}

export function CollectionsWorkspace({ labels }: { labels: CollectionLabels }) {
  const [state, setState] = useState<CollectionState>(emptyCollectionState);
  const [newRef, setNewRef] = useState("");
  const [message, setMessage] = useState("");
  const [invalid, setInvalid] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [corruptRaw, setCorruptRaw] = useState<string | null>(null);
  const [disclosurePreview, setDisclosurePreview] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem(collectionsStorageKey);
    try {
      let nextState = raw ? parseCollectionJson(raw) : emptyCollectionState;
      if (window.location.hash.startsWith("#collection-notes=")) {
        nextState = mergeDisclosedState(
          nextState,
          decodeDisclosedCollectionFragment(window.location.hash),
        );
      } else if (window.location.hash.startsWith("#collection=")) {
        nextState = mergeRefs(nextState, decodeCollectionFragment(window.location.hash));
      } else if (window.location.hash.startsWith("#member=")) {
        const ref = decodeURIComponent(window.location.hash.slice("#member=".length));
        if (isExactDatasetRef(ref)) nextState = mergeRefs(nextState, [ref]);
      }
      // oxlint-disable-next-line react-hooks/set-state-in-effect -- Browser-only state is hydrated after SSR.
      setState(nextState);
    } catch {
      // oxlint-disable-next-line react-hooks/set-state-in-effect -- Corrupt storage is reported without rendering it.
      setInvalid(true);
      // oxlint-disable-next-line react-hooks/set-state-in-effect -- Raw corrupt data is quarantined for explicit recovery.
      setCorruptRaw(raw);
    }
    // oxlint-disable-next-line react-hooks/set-state-in-effect -- Enables persistence only after hydration completes.
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated || corruptRaw !== null) return;
    try {
      localStorage.setItem(collectionsStorageKey, JSON.stringify(state));
    } catch {
      // oxlint-disable-next-line react-hooks/set-state-in-effect -- Storage failure is surfaced locally without sending collection data anywhere.
      setMessage(labels.error);
    }
  }, [corruptRaw, hydrated, labels.error, state]);

  const updateMember = (ref: string, patch: Partial<CollectionMember>) => {
    setState((current) => ({
      ...current,
      members: current.members.map((member) =>
        member.ref === ref ? { ...member, ...patch } : member,
      ),
    }));
    setMessage(labels.saved);
  };

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.download = "tiangong-portal-collection.json";
    anchor.href = url;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col gap-6">
      {invalid ? (
        <Alert variant="destructive">
          <AlertTitle>{labels.error}</AlertTitle>
          <AlertDescription>{labels.error}</AlertDescription>
        </Alert>
      ) : null}
      {corruptRaw !== null ? (
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => {
              const blob = new Blob([corruptRaw], { type: "application/json" });
              const url = URL.createObjectURL(blob);
              const anchor = document.createElement("a");
              anchor.download = "tiangong-portal-corrupt-collection.json";
              anchor.href = url;
              anchor.click();
              URL.revokeObjectURL(url);
            }}
            type="button"
            variant="outline"
          >
            <DownloadIcon data-icon="inline-start" />
            {labels.downloadCorrupt}
          </Button>
          <Button
            onClick={() => {
              localStorage.removeItem(collectionsStorageKey);
              setCorruptRaw(null);
              setInvalid(false);
              setState(emptyCollectionState);
            }}
            type="button"
            variant="destructive"
          >
            <Trash2Icon data-icon="inline-start" />
            {labels.clearCorrupt}
          </Button>
        </div>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>{labels.researchName}</CardTitle>
          <CardDescription>{labels.purpose}</CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="collection-name">{labels.researchName}</FieldLabel>
              <Input
                id="collection-name"
                maxLength={128}
                onChange={(event) =>
                  setState((current) => ({ ...current, researchName: event.target.value }))
                }
                value={state.researchName}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="collection-purpose">{labels.purpose}</FieldLabel>
              <Textarea
                id="collection-purpose"
                maxLength={512}
                onChange={(event) =>
                  setState((current) => ({ ...current, purpose: event.target.value }))
                }
                value={state.purpose}
              />
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>

      <form
        className="flex flex-col gap-3 sm:flex-row sm:items-end"
        onSubmit={(event) => {
          event.preventDefault();
          const ref = newRef.trim();
          if (!isExactDatasetRef(ref)) {
            setInvalid(true);
            return;
          }
          setState((current) => mergeRefs(current, [ref]));
          setNewRef("");
          setInvalid(false);
          setMessage(labels.saved);
        }}
      >
        <Field className="flex-1" data-invalid={invalid || undefined}>
          <FieldLabel htmlFor="collection-member">{labels.memberRef}</FieldLabel>
          <Input
            aria-invalid={invalid || undefined}
            id="collection-member"
            onChange={(event) => setNewRef(event.target.value)}
            placeholder={labels.memberPlaceholder}
            value={newRef}
          />
          <FieldDescription>{labels.memberPlaceholder}</FieldDescription>
        </Field>
        <Button className="min-h-11" type="submit">
          <PlusIcon data-icon="inline-start" />
          {labels.add}
        </Button>
      </form>

      {state.members.length === 0 ? (
        <Alert>
          <AlertDescription>{labels.empty}</AlertDescription>
        </Alert>
      ) : (
        <ul className="flex flex-col gap-3">
          {state.members.map((member) => (
            <li key={member.ref}>
              <Card size="sm">
                <CardHeader>
                  <CardTitle className="font-mono text-sm break-all">{member.ref}</CardTitle>
                  <CardDescription>{labels.memberRef}</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                  <ToggleGroup
                    aria-label={labels.memberRef}
                    onValueChange={(status) => {
                      if (
                        status === "candidate" ||
                        status === "selected" ||
                        status === "excluded"
                      ) {
                        updateMember(member.ref, { status });
                      }
                    }}
                    type="single"
                    value={member.status}
                    variant="outline"
                  >
                    <ToggleGroupItem className="min-h-11" value="candidate">
                      {labels.candidate}
                    </ToggleGroupItem>
                    <ToggleGroupItem className="min-h-11" value="selected">
                      {labels.selected}
                    </ToggleGroupItem>
                    <ToggleGroupItem className="min-h-11" value="excluded">
                      {labels.excluded}
                    </ToggleGroupItem>
                  </ToggleGroup>
                  <Field>
                    <FieldLabel htmlFor={`note-${member.ref}`}>{labels.note}</FieldLabel>
                    <Textarea
                      id={`note-${member.ref}`}
                      maxLength={512}
                      onChange={(event) => updateMember(member.ref, { note: event.target.value })}
                      value={member.note}
                    />
                  </Field>
                  <Button
                    className="self-start"
                    onClick={() =>
                      setState((current) => ({
                        ...current,
                        members: current.members.filter(
                          (candidate) => candidate.ref !== member.ref,
                        ),
                      }))
                    }
                    type="button"
                    variant="destructive"
                  >
                    <Trash2Icon data-icon="inline-start" />
                    {labels.remove}
                  </Button>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-wrap gap-2">
        <Button
          disabled={state.members.length === 0}
          onClick={exportJson}
          type="button"
          variant="outline"
        >
          <DownloadIcon data-icon="inline-start" />
          {labels.export}
        </Button>
        <Field>
          <FieldLabel htmlFor="collection-import">{labels.import}</FieldLabel>
          <Input
            accept="application/json,.json"
            id="collection-import"
            onChange={async (event) => {
              const file = event.target.files?.[0];
              if (!file) return;
              try {
                if (file.size > maxCollectionImportBytes)
                  throw new Error("collection_import_too_large");
                setState(parseCollectionJson(await file.text()));
                setCorruptRaw(null);
                setInvalid(false);
                setMessage(labels.imported);
              } catch {
                setInvalid(true);
                setMessage(labels.error);
              }
              event.target.value = "";
            }}
            type="file"
          />
        </Field>
        <Button
          disabled={state.members.length === 0}
          onClick={async () => {
            try {
              const fragment = encodeCollectionFragment(state.members);
              const url = `${window.location.origin}${window.location.pathname}${fragment}`;
              await navigator.clipboard.writeText(url);
              setMessage(labels.shared);
            } catch {
              setMessage(labels.error);
            }
          }}
          type="button"
          variant="outline"
        >
          <LinkIcon data-icon="inline-start" />
          {labels.share}
        </Button>
        <Button
          disabled={state.members.length === 0}
          onClick={() => setDisclosurePreview(true)}
          type="button"
          variant="outline"
        >
          <EyeIcon data-icon="inline-start" />
          {labels.shareWithNotes}
        </Button>
      </div>
      {disclosurePreview ? (
        <Card size="sm">
          <CardHeader>
            <h2 className="font-heading text-base font-medium">{labels.sharePreview}</h2>
            <CardDescription>{labels.shareDisclosure}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <pre className="bg-muted max-h-80 overflow-auto rounded-lg p-3 text-xs break-words whitespace-pre-wrap">
              {JSON.stringify(state, null, 2)}
            </pre>
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={async () => {
                  try {
                    const fragment = encodeDisclosedCollectionFragment(state);
                    const url = `${window.location.origin}${window.location.pathname}${fragment}`;
                    await navigator.clipboard.writeText(url);
                    setMessage(labels.sharedWithNotes);
                    setDisclosurePreview(false);
                  } catch {
                    setMessage(labels.error);
                  }
                }}
                type="button"
              >
                <LinkIcon data-icon="inline-start" />
                {labels.shareConfirm}
              </Button>
              <Button onClick={() => setDisclosurePreview(false)} type="button" variant="ghost">
                <XIcon data-icon="inline-start" />
                {labels.shareCancel}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}
      <p aria-live="polite" className="text-muted-foreground min-h-5 text-sm">
        {message}
      </p>
      <span className="sr-only">
        <UploadIcon aria-hidden="true" />
      </span>
    </div>
  );
}
