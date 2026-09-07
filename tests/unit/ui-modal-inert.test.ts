import { afterEach, describe, expect, it } from "vitest";
import { isolateModalContent } from "@/components/ui/modal-inert";

afterEach(() => document.body.replaceChildren());

describe("Select background isolation", () => {
  it("restores existing inert attributes and leaves the open content available", () => {
    document.body.innerHTML =
      '<main><button>Background</button></main><aside inert="retained"></aside><div><section id="menu"></section></div>';
    const main = document.querySelector("main")!;
    const aside = document.querySelector("aside")!;
    const menu = document.getElementById("menu")!;
    const restore = isolateModalContent(menu);
    expect(main).toHaveAttribute("inert");
    expect(menu.closest("[inert]")).toBeNull();
    restore();
    expect(main).not.toHaveAttribute("inert");
    expect(aside).toHaveAttribute("inert", "retained");
  });

  it("keeps the background inert until overlapping modal owners have both closed", () => {
    document.body.innerHTML = '<main></main><section id="first"></section>';
    const first = document.getElementById("first")!;
    const closeFirst = isolateModalContent(first);
    const nested = document.createElement("section");
    document.body.append(nested);
    const closeNested = isolateModalContent(nested);
    expect(first).toHaveAttribute("inert");
    closeFirst();
    expect(document.querySelector("main")).toHaveAttribute("inert");
    expect(nested.closest("[inert]")).toBeNull();
    closeNested();
    expect(document.querySelector("[inert]")).toBeNull();
  });
});
