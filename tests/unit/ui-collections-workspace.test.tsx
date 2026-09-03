import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { CollectionsWorkspace } from "@/features/collections/collections-workspace";
import en from "@/i18n/messages/en.json";
import { collectionsStorageKey } from "@/features/collections/storage";
import { collectionsStorageKeyV2, emptyCollectionStateV2 } from "@/features/collections/storage-v2";

const labels = {
  ...en.Collections,
  add: "Add",
  candidate: "Candidate",
  clearCorrupt: "Clear corrupt",
  downloadCorrupt: "Download corrupt",
  empty: "Empty",
  error: "Storage unavailable",
  storageError: "Storage unavailable",
  excluded: "Excluded",
  export: "Export",
  import: "Import",
  imported: "Imported",
  memberPlaceholder: "uuid@version",
  memberRef: "Member",
  note: "Note",
  purpose: "Purpose",
  remove: "Remove",
  researchName: "Research",
  saved: "Saved",
  selected: "Selected",
  share: "Share",
  shareCancel: "Cancel share",
  shareConfirm: "Confirm share",
  shareDisclosure: "Disclosure warning",
  sharePreview: "Share preview",
  shareWithNotes: "Share notes",
  shared: "Shared",
  sharedWithNotes: "Shared notes",
};
const ref = "11111111-1111-1111-1111-111111111111@01.00.000";
const legacy = {
  schemaVersion: collectionsStorageKey,
  researchName: "Private study",
  purpose: "Private purpose",
  members: [{ ref, note: "Private rationale", status: "selected" }],
};
function mount() {
  return render(<CollectionsWorkspace common={en.Common} labels={labels} locale="en" />);
}

beforeEach(() => {
  history.replaceState(null, "", "/en/collections");
  vi.stubGlobal(
    "fetch",
    vi.fn<typeof fetch>(async (_url, init) => {
      const input = JSON.parse(init!.body as string) as {
        items: { kind: "process" | "flow" | null; ref: string }[];
      };
      return Response.json({
        items: input.items.map((item) => ({
          ...item,
          status: "resolved",
          matches: [{ kind: item.kind ?? "process", ref: item.ref, name: "Public electricity" }],
        })),
      });
    }),
  );
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  localStorage.clear();
});

describe("collection persistence", () => {
  it("keeps in-memory state and reports localStorage write failures locally", async () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("Quota exceeded", "QuotaExceededError");
    });

    mount();

    await waitFor(() => expect(screen.getByText("Storage unavailable")).toBeInTheDocument());
    expect(screen.getByLabelText("Research")).toBeInTheDocument();
  });

  it("migrates the old key without deleting notes or guessing a type, and sends only visible identities", async () => {
    localStorage.setItem(collectionsStorageKey, JSON.stringify(legacy));
    mount();
    expect(await screen.findByRole("link", { name: "Public electricity" })).toHaveAttribute(
      "href",
      `/en/process/${encodeURIComponent(ref)}`,
    );
    expect(screen.getByLabelText("Note")).toHaveValue("Private rationale");
    const stored = JSON.parse(localStorage.getItem(collectionsStorageKeyV2)!);
    expect(stored.members[0]).toEqual({
      kind: null,
      ref,
      note: "Private rationale",
      status: "selected",
    });
    expect(localStorage.getItem(collectionsStorageKey)).toBe(JSON.stringify(legacy));
    const fetchMock = vi.mocked(fetch);
    const body = fetchMock.mock.calls[0]![1]!.body as string;
    expect(JSON.parse(body)).toEqual({ locale: "en", items: [{ kind: null, ref }] });
    expect(body).not.toContain("Private");
  });

  it("does not overwrite unreadable storage or clear it without confirmation", async () => {
    localStorage.setItem(collectionsStorageKeyV2, "unreadable");
    mount();
    expect(await screen.findByText(labels.corruptError)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: labels.clearCorrupt }));
    expect(localStorage.getItem(collectionsStorageKeyV2)).toBe("unreadable");
    fireEvent.click(screen.getByRole("button", { name: labels.shareCancel }));
    expect(localStorage.getItem(collectionsStorageKeyV2)).toBe("unreadable");
    expect(fetch).not.toHaveBeenCalled();
  });

  it("keeps new work exportable when storage reads are blocked, without attempting a write", async () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new DOMException("blocked", "SecurityError");
    });
    const write = vi.spyOn(Storage.prototype, "setItem");
    mount();
    expect(await screen.findByText(labels.storageReadError)).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Research"), { target: { value: "in memory" } });
    expect(screen.getByLabelText("Research")).toHaveValue("in memory");
    expect(screen.getByRole("button", { name: "Export" })).toBeEnabled();
    expect(write).not.toHaveBeenCalled();
  });

  it("previews an import and only replaces existing notes after explicit confirmation", async () => {
    localStorage.setItem(collectionsStorageKey, JSON.stringify(legacy));
    mount();
    await screen.findByRole("link", { name: "Public electricity" });
    const incoming = {
      ...emptyCollectionStateV2,
      researchName: "Incoming",
      members: [{ kind: "flow", ref, note: "Imported note", status: "excluded" }],
    };
    const file = new File([JSON.stringify(incoming)], "backup.json", { type: "application/json" });
    Object.defineProperty(file, "text", { value: async () => JSON.stringify(incoming) });
    fireEvent.change(screen.getByLabelText("Import", { selector: "input" }), {
      target: { files: [file] },
    });
    const preview = await screen.findByRole("region", { name: labels.importTitle });
    expect(screen.getByLabelText("Research")).toHaveValue("Private study");
    expect(screen.getByLabelText("Note")).toHaveValue("Private rationale");
    fireEvent.click(within(preview).getByRole("button", { name: labels.importConfirm }));
    await waitFor(() => expect(screen.getByLabelText("Research")).toHaveValue("Incoming"));
    expect(screen.getByLabelText("Note")).toHaveValue("Imported note");
  });

  it("separates invalid shared links from corrupt local storage", async () => {
    localStorage.setItem(collectionsStorageKey, JSON.stringify(legacy));
    history.replaceState(null, "", "/en/collections#collection=bad");
    mount();
    expect(await screen.findByText(labels.invalidLink)).toBeInTheDocument();
    expect(screen.getByLabelText("Note")).toHaveValue("Private rationale");
    expect(screen.queryByRole("button", { name: labels.clearCorrupt })).not.toBeInTheDocument();
  });

  it("copies notes only after a readable snapshot and explicit confirmation", async () => {
    localStorage.setItem(collectionsStorageKey, JSON.stringify(legacy));
    const writeText = vi.fn<(value: string) => Promise<void>>(async () => undefined);
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText } });
    mount();
    await screen.findByRole("link", { name: "Public electricity" });
    fireEvent.click(screen.getByRole("button", { name: "Share notes" }));
    const preview = screen.getByRole("region", { name: "Share preview" });
    expect(within(preview).getByText("Note: Private rationale")).toBeInTheDocument();
    expect(writeText).not.toHaveBeenCalled();
    fireEvent.click(within(preview).getByRole("button", { name: "Confirm share" }));
    await waitFor(() => expect(writeText).toHaveBeenCalledTimes(1));
    expect(writeText.mock.calls[0]![0]).toContain("#collection-notes=");
  });

  it("resolves at most ten visible rows and does not refetch when a private note changes", async () => {
    const members = Array.from({ length: 21 }, (_, index) => ({
      kind: "process",
      ref: `${String(index).padStart(8, "0")}-0000-0000-0000-000000000000@01.00.000`,
      note: "",
      status: "candidate",
    }));
    localStorage.setItem(
      collectionsStorageKeyV2,
      JSON.stringify({ ...emptyCollectionStateV2, members }),
    );
    mount();
    await screen.findAllByRole("link", { name: "Public electricity" });
    expect(vi.mocked(fetch)).toHaveBeenCalledTimes(1);
    expect(JSON.parse(vi.mocked(fetch).mock.calls[0]![1]!.body as string).items).toHaveLength(10);
    fireEvent.change(screen.getAllByLabelText("Note")[0]!, { target: { value: "never sent" } });
    expect(fetch).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(2));
  });
});
