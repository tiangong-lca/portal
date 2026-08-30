import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { CitationCopy } from "@/features/catalog/citation-copy";

const citation = "TianGong LCA. Example process. Version 1.";

afterEach(cleanup);

describe("citation presentation", () => {
  it("shows the complete citation on record detail pages by default", () => {
    render(<CitationCopy citation={citation} copiedLabel="Copied" copyLabel="Copy citation" />);

    expect(screen.getByText(citation)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Copy citation" })).toBeInTheDocument();
  });

  it("can keep compact result cards focused on the copy action", () => {
    render(
      <CitationCopy
        citation={citation}
        copiedLabel="Copied"
        copyLabel="Copy citation"
        showText={false}
      />,
    );

    expect(screen.queryByText(citation)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Copy citation" })).toBeInTheDocument();
  });
});
