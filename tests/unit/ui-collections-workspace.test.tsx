import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { CollectionsWorkspace } from "@/features/collections/collections-workspace";

const labels = {
  add: "Add",
  candidate: "Candidate",
  clearCorrupt: "Clear corrupt",
  downloadCorrupt: "Download corrupt",
  empty: "Empty",
  error: "Storage unavailable",
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
  shared: "Shared",
};

afterEach(() => {
  vi.restoreAllMocks();
  localStorage.clear();
});

describe("collection persistence", () => {
  it("keeps in-memory state and reports localStorage write failures locally", async () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("Quota exceeded", "QuotaExceededError");
    });

    render(<CollectionsWorkspace labels={labels} />);

    await waitFor(() => expect(screen.getByText("Storage unavailable")).toBeInTheDocument());
    expect(screen.getByLabelText("Research")).toBeInTheDocument();
  });
});
