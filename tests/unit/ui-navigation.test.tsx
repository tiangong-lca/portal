import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const route = vi.hoisted(() => ({ pathname: "/en/search" }));
vi.mock("next/navigation", () => ({ usePathname: () => route.pathname }));

import { HeaderOffset } from "@/components/shell/header-offset";
import { NavigationLink } from "@/components/shell/navigation-link";

describe("current navigation and fixed-header clearance", () => {
  beforeEach(() => {
    route.pathname = "/en/search";
  });
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("marks the current route without depending on its query string", () => {
    render(<NavigationLink href="/en/search?v=1">Search</NavigationLink>);
    expect(screen.getByRole("link", { name: "Search" })).toHaveAttribute("aria-current", "page");
  });

  it("keeps unrelated routes inactive and supports a browse family", () => {
    route.pathname = "/en/browse/source";
    render(
      <>
        <NavigationLink href="/en/search?v=1">Search</NavigationLink>
        <NavigationLink href="/en/browse/process" matchPrefix="/en/browse">
          Browse
        </NavigationLink>
      </>,
    );
    expect(screen.getByRole("link", { name: "Search" })).not.toHaveAttribute("aria-current");
    expect(screen.getByRole("link", { name: "Browse" })).toHaveAttribute("aria-current", "page");
  });

  it("recognizes canonical and URL-encoded exact-version routes without selecting a subpage", () => {
    route.pathname = "/en/process/11111111-1111-1111-1111-111111111111@01.00.000";
    render(
      <>
        <NavigationLink href="/en/process/11111111-1111-1111-1111-111111111111%4001.00.000">
          Overview
        </NavigationLink>
        <NavigationLink href="/en/process/11111111-1111-1111-1111-111111111111%4001.00.000/versions">
          Versions
        </NavigationLink>
      </>,
    );
    expect(screen.getByRole("link", { name: "Overview" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Versions" })).not.toHaveAttribute("aria-current");
  });

  it("measures the actual header and updates after a viewport resize", () => {
    vi.stubGlobal("ResizeObserver", undefined);
    let height = 69;
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(
      () => new DOMRect(0, 0, 1440, height),
    );
    const view = render(
      <header data-portal-header>
        <HeaderOffset />
      </header>,
    );
    expect(document.documentElement.style.getPropertyValue("--portal-header-height")).toBe("69px");
    height = 125;
    window.dispatchEvent(new Event("resize"));
    expect(document.documentElement.style.getPropertyValue("--portal-header-height")).toBe("125px");
    view.unmount();
    expect(document.documentElement.style.getPropertyValue("--portal-header-height")).toBe("");
  });
});
