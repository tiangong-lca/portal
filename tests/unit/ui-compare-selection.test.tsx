import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  CompareChoice,
  CompareSelectionForm,
  CompareSelectionProvider,
  CompareSelectionSeed,
} from "@/features/compare/selection";

const push = vi.hoisted(() => vi.fn<(href: string) => void>());
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
const labels = {
  count: "{count}/4 selected",
  clear: "Clear",
  remove: "Remove",
  continue: "Review selection",
  compare: "Compare versions",
  hint: "Choose at least two",
  limit: "Maximum four",
};
const items = Array.from({ length: 5 }, (_, index) => ({
  name: `Dataset ${index}`,
  ref: `${String(index).padStart(8, "0")}-0000-0000-0000-000000000000@01.00.000`,
}));
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("cross-route comparison selection", () => {
  it("retains hidden-page selections, enforces four, and navigates with public IDs only", async () => {
    const view = render(
      <CompareSelectionProvider labels={labels} locale="en">
        <CompareSelectionForm action="/en/compare">
          {items.map((item) => (
            <CompareChoice checkbox item={item} key={item.ref} label="Select" locale="en" />
          ))}
          <button type="submit">Open selected</button>
        </CompareSelectionForm>
      </CompareSelectionProvider>,
    );
    const inputs = screen.getAllByRole("checkbox");
    inputs.slice(0, 4).forEach((input) => fireEvent.click(input));
    fireEvent.click(inputs[4]!);
    expect(inputs[4]).not.toBeChecked();
    expect(screen.getByText("Maximum four")).toBeInTheDocument();
    view.rerender(
      <CompareSelectionProvider labels={labels} locale="en">
        <CompareSelectionForm action="/en/compare">
          <p>Another search page</p>
          <button type="submit">Open selected</button>
        </CompareSelectionForm>
      </CompareSelectionProvider>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Open selected" }));
    await waitFor(() => expect(push).toHaveBeenCalledTimes(1));
    const url = new URL(push.mock.calls[0]![0], "https://portal.example");
    expect(url.searchParams.get("ids")?.split(",")).toEqual(
      items.slice(0, 4).map((item) => item.ref),
    );
    expect([...url.searchParams.keys()]).toEqual(["v", "ids"]);
    expect(url.toString()).not.toContain("Dataset");
  });

  it("initializes a direct comparison link without reading or writing browser storage", async () => {
    const write = vi.spyOn(Storage.prototype, "setItem");
    render(
      <CompareSelectionProvider labels={labels} locale="en">
        <CompareSelectionSeed items={items.slice(0, 2)} />
      </CompareSelectionProvider>,
    );
    expect(await screen.findByText("2/4 selected")).toBeInTheDocument();
    expect(write).not.toHaveBeenCalled();
    write.mockRestore();
  });
});
