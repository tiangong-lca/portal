import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import HomePage from "@/app/page";

describe("Portal bootstrap page", () => {
  it("presents the anonymous public discovery purpose", () => {
    render(<HomePage />);

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "公开生命周期数据，从发现到引用。",
    );
    expect(screen.getByText("Process 与 Flow 公共目录")).toBeInTheDocument();
  });
});
