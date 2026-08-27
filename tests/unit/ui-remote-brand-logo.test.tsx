import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { BrandLogoImage } from "@/components/brand/brand-logo-image";

describe("remote brand logo smoke", () => {
  it("keeps reviewed remote SVG references external with intrinsic dimensions", () => {
    const { container } = render(
      <BrandLogoImage
        alt="Example brand"
        darkLogo="https://assets.example.com/logo-dark.svg"
        height={96}
        lightLogo="https://assets.example.com/logo.svg"
        logoMark="https://assets.example.com/mark.svg"
        priority={false}
        width={120}
      />,
    );

    const light = container.querySelector<HTMLImageElement>("[data-brand-light-logo]");
    const dark = container.querySelector<HTMLImageElement>("[data-brand-dark-logo]");
    const mark = container.querySelector<HTMLImageElement>("[data-brand-logo-mark]");
    expect(light).toHaveAttribute("src", "https://assets.example.com/logo.svg");
    expect(dark).toHaveAttribute("src", "https://assets.example.com/logo-dark.svg");
    expect(mark).toHaveAttribute("src", "https://assets.example.com/mark.svg");
    expect(light).toHaveAttribute("width", "120");
    expect(light).toHaveAttribute("height", "96");
  });
});
