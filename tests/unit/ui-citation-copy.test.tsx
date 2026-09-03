import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { CitationCopy } from "@/features/catalog/citation-copy";

const citation = "TianGong LCA. Example process. Version 1.";

afterEach(cleanup);

describe("citation presentation", () => {
  it("shows the complete citation on record detail pages by default", () => {
    render(
      <CitationCopy
        citation={citation}
        copiedLabel="Copied"
        copyLabel="Copy citation"
        failureLabel="Copy failed"
      />,
    );

    expect(screen.getByText(citation)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Copy citation" })).toBeInTheDocument();
  });

  it("can keep compact result cards focused on the copy action", () => {
    render(
      <CitationCopy
        citation={citation}
        copiedLabel="Copied"
        failureLabel="Copy failed"
        copyLabel="Copy citation"
        showText={false}
      />,
    );

    expect(screen.queryByText(citation)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Copy citation" })).toBeInTheDocument();
  });

  it("reports clipboard denial and exposes selectable text without an unhandled error", async () => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: vi.fn<(value: string) => Promise<void>>(async () => {
          throw new Error("clipboard denied");
        }),
      },
    });
    render(
      <CitationCopy
        citation={citation}
        copiedLabel="Copied"
        copyLabel="Copy citation"
        failureLabel="Copy failed"
        showText={false}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Copy citation" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Copy failed");
    expect(screen.getByText(citation)).toBeInTheDocument();
  });
});
