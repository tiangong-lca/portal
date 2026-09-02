"use client";

import { useEffect, useReducer, useRef } from "react";

import type { PortalLocale } from "@/i18n/routing";
import type { PortalHybridVersionSearchRequest } from "@/lib/hybrid-request";
import type { PortalHybridBffVersionResponse } from "@/server/hybrid/contracts";
import { mapProgressiveSearchPage } from "./map-public-data";

type Page = PortalHybridBffVersionResponse;
type HybridPage = Extract<Page, { mode: "hybrid" }>;
type Outcome = "idle" | "pending" | "complete" | "failed";
type PageError = "cursor_expired" | "page_unavailable" | null;

export type ProgressiveSearchState = {
  id: number;
  request: PortalHybridVersionSearchRequest | null;
  response: Page | null;
  pendingUpdate: HybridPage | null;
  lexical: Outcome;
  hybrid: Outcome | "empty";
  pageLoading: boolean;
  pageError: PageError;
};

const initialState: ProgressiveSearchState = {
  id: 0,
  request: null,
  response: null,
  pendingUpdate: null,
  lexical: "idle",
  hybrid: "idle",
  pageLoading: false,
  pageError: null,
};

type Action =
  | { type: "start"; id: number; request: PortalHybridVersionSearchRequest }
  | { type: "lexical" | "hybrid"; id: number; page: Page }
  | { type: "failed"; id: number; source: "lexical" | "hybrid" }
  | { type: "apply" | "page_start"; id: number }
  | { type: "page"; id: number; page: Page }
  | { type: "page_error"; id: number; error: PageError };

function appendPage(current: Page, next: Page): Page {
  if (current.mode === "hybrid" && next.mode === "hybrid") {
    return {
      ...next,
      items: [...current.items, ...next.items],
      versionGroups: [...current.versionGroups, ...next.versionGroups],
    };
  }
  if (current.mode !== "hybrid" && next.mode !== "hybrid") {
    return { ...next, items: [...current.items, ...next.items] };
  }
  return current;
}

export function progressiveSearchReducer(
  state: ProgressiveSearchState,
  action: Action,
): ProgressiveSearchState {
  if (action.type === "start")
    return {
      ...initialState,
      id: action.id,
      request: action.request,
      lexical: "pending",
      hybrid: "pending",
    };
  if (action.id !== state.id) return state;
  switch (action.type) {
    case "lexical":
      return {
        ...state,
        lexical: "complete",
        response:
          state.hybrid === "empty" && action.page.items.length > 0
            ? action.page
            : (state.response ?? action.page),
      };
    case "hybrid":
      if (action.page.mode !== "hybrid")
        return { ...state, hybrid: "failed", response: state.response ?? action.page };
      if (action.page.items.length === 0)
        return {
          ...state,
          hybrid: "empty",
          response: state.response ?? action.page,
          pendingUpdate: null,
        };
      if (state.response && state.response.items.length > 0 && state.response.mode !== "hybrid") {
        return { ...state, hybrid: "complete", pendingUpdate: action.page };
      }
      return { ...state, hybrid: "complete", response: action.page, pendingUpdate: null };
    case "failed":
      return { ...state, [action.source]: "failed" };
    case "apply":
      return state.pendingUpdate
        ? {
            ...state,
            response: state.pendingUpdate,
            pendingUpdate: null,
            pageLoading: false,
            pageError: null,
          }
        : state;
    case "page_start":
      return { ...state, pageLoading: true, pageError: null };
    case "page":
      return {
        ...state,
        response: state.response ? appendPage(state.response, action.page) : state.response,
        pageLoading: false,
        pageError: null,
      };
    case "page_error":
      return { ...state, pageLoading: false, pageError: action.error };
  }
}

function record(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function validKey(
  value: unknown,
  kind: "process" | "flow",
): value is { kind: string; id: string; version: string } {
  return (
    record(value) &&
    value.kind === kind &&
    typeof value.id === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/u.test(value.id) &&
    typeof value.version === "string" &&
    /^\d{2}\.\d{2}\.\d{3}$/u.test(value.version)
  );
}

function readPage(value: unknown, kind: "process" | "flow", locale: PortalLocale): Page {
  if (
    !record(value) ||
    value.schemaVersion !== "portal.hybrid-bff.v2" ||
    value.kind !== kind ||
    !["hybrid", "lexical", "lexical_fallback"].includes(String(value.mode)) ||
    typeof value.queryFingerprint !== "string" ||
    !/^[0-9a-f]{64}$/u.test(value.queryFingerprint) ||
    !(
      value.nextCursor === null ||
      (typeof value.nextCursor === "string" && /^[A-Za-z0-9_-]{1,4096}$/u.test(value.nextCursor))
    ) ||
    !Array.isArray(value.items) ||
    value.items.length > 20 ||
    value.items.some((item) => !record(item) || !validKey(item.key, kind))
  ) {
    throw new Error("invalid_search_page");
  }
  const items = value.items;
  if (value.mode === "hybrid") {
    const groups = value.versionGroups;
    if (
      !Array.isArray(groups) ||
      groups.length !== items.length ||
      !record(value.interpretation) ||
      typeof value.interpretation.semanticQuery !== "string" ||
      !Array.isArray(value.interpretation.terms) ||
      value.interpretation.terms.some(
        (term) =>
          !record(term) || typeof term.language !== "string" || typeof term.value !== "string",
      ) ||
      groups.some(
        (group, index) =>
          !record(group) ||
          !validKey(group.key, kind) ||
          !record(items[index]) ||
          !validKey(items[index].key, kind) ||
          group.key.id !== items[index].key.id ||
          group.key.version !== items[index].key.version ||
          !Array.isArray(group.matches) ||
          group.matches.length < 1 ||
          group.matches.length > 400 ||
          group.matches.some(
            (member) =>
              !record(member) ||
              !validKey(member.key, kind) ||
              member.key.id !== (group.key as { id: string }).id ||
              !record(member.match) ||
              !Array.isArray(member.match.reasonCodes),
          ),
      )
    ) {
      throw new Error("invalid_version_groups");
    }
  }
  // The server enforces the full signed DTO. Also exercise all display fields
  // here so malformed transport data becomes a recoverable request error.
  const page = value as Page;
  mapProgressiveSearchPage(page, locale);
  return page;
}

async function fetchPage(
  request: PortalHybridVersionSearchRequest,
  source: "lexical" | "hybrid",
  signal: AbortSignal,
  locale: PortalLocale,
): Promise<Page> {
  const response = await fetch(
    source === "lexical" ? "/internal/hybrid/lexical" : "/internal/hybrid",
    {
      method: "POST",
      body: JSON.stringify(request),
      headers: { "content-type": "application/json" },
      cache: "no-store",
      redirect: "error",
      signal,
    },
  );
  const payload: unknown = await response.json();
  if (response.status === 409 && record(payload) && payload.code === "hybrid_cursor_expired")
    throw new Error("cursor_expired");
  if (!response.ok) throw new Error("search_unavailable");
  const page = readPage(payload, request.kind, locale);
  if (
    (source === "lexical" && page.mode !== "lexical") ||
    (source === "hybrid" && page.mode === "lexical")
  )
    throw new Error("wrong_search_mode");
  return page;
}

export function useProgressiveSearch(locale: PortalLocale) {
  const [state, dispatch] = useReducer(progressiveSearchReducer, initialState);
  const sequence = useRef(0);
  const active = useRef<AbortController | null>(null);
  const pagination = useRef<AbortController | null>(null);

  useEffect(
    () => () => {
      sequence.current += 1;
      active.current?.abort();
      pagination.current?.abort();
    },
    [],
  );

  function start(request: PortalHybridVersionSearchRequest) {
    active.current?.abort();
    pagination.current?.abort();
    pagination.current = null;
    const controller = new AbortController();
    active.current = controller;
    const id = ++sequence.current;
    const freshRequest = { ...request, cursor: null };
    dispatch({ type: "start", id, request: freshRequest });
    const run = async (source: "lexical" | "hybrid") => {
      try {
        const page = await fetchPage(freshRequest, source, controller.signal, locale);
        if (!controller.signal.aborted) dispatch({ type: source, id, page });
      } catch {
        if (!controller.signal.aborted) dispatch({ type: "failed", id, source });
      }
    };
    void run("lexical");
    void run("hybrid");
  }

  function applyUpdate() {
    pagination.current?.abort();
    pagination.current = null;
    dispatch({ type: "apply", id: state.id });
  }

  async function loadMore() {
    const { request, response, id } = state;
    if (!request || !response?.nextCursor || pagination.current) return;
    const controller = new AbortController();
    pagination.current = controller;
    dispatch({ type: "page_start", id });
    try {
      const page = await fetchPage(
        { ...request, cursor: response.nextCursor },
        response.mode === "hybrid" ? "hybrid" : "lexical",
        controller.signal,
        locale,
      );
      if (controller.signal.aborted) return;
      const keyOf = (item: Page["items"][number]) =>
        response.mode === "hybrid" ? item.key.id : `${item.key.id}@${item.key.version}`;
      const existing = new Set(response.items.map(keyOf));
      if (
        page.queryFingerprint !== response.queryFingerprint ||
        page.nextCursor === response.nextCursor ||
        (page.mode === "hybrid") !== (response.mode === "hybrid") ||
        page.items.some((item) => existing.has(keyOf(item)))
      ) {
        throw new Error("page_changed");
      }
      dispatch({ type: "page", id, page });
    } catch (error) {
      if (!controller.signal.aborted)
        dispatch({
          type: "page_error",
          id,
          error:
            error instanceof Error && error.message === "cursor_expired"
              ? "cursor_expired"
              : "page_unavailable",
        });
    } finally {
      if (pagination.current === controller) pagination.current = null;
    }
  }

  const running =
    state.hybrid === "pending" ||
    ((!state.response || state.response.items.length === 0) && state.lexical === "pending");
  const unavailable = state.hybrid === "failed" && state.lexical === "failed" && !state.response;
  return { state, start, applyUpdate, loadMore, running, unavailable };
}
