import { TeamEnsembleEditor } from "./team-ensemble-editor";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, waitFor } from "storybook/test";

import { TeamEnsemble } from "@/features/team/team-ensemble";
import { teamMembers } from "@/features/team/team-data";

import { dictionaries, mobileGlobals, storyLocale } from "../fixtures";

const meta = {
  title: "Brand/Team Ensemble",
  component: TeamEnsemble,
  args: { labels: dictionaries["zh-CN"].Team },
  parameters: { layout: "fullscreen" },
  render: (_, { globals }) => (
    <div className="mx-auto max-w-[1280px] p-4 sm:p-8">
      <TeamEnsemble labels={dictionaries[storyLocale(globals)].Team} />
    </div>
  ),
} satisfies Meta<typeof TeamEnsemble>;

const interactionPlay = async ({
  canvas,
  canvasElement,
  globals,
}: Parameters<NonNullable<Story["play"]>>[0]) => {
  const labels = dictionaries[storyLocale(globals)].Team;
  await expect(canvasElement.querySelectorAll(".team-ensemble-person")).toHaveLength(
    teamMembers.length,
  );
  for (const [band, count] of [
    ["back", 8],
    ["middle", 8],
    ["front", 7],
  ] as const) {
    await expect(canvasElement.querySelectorAll(`[data-band="${band}"]`)).toHaveLength(count);
  }
  const ming = canvas.getByRole("button", {
    name: labels.ensembleOpen.replace("{name}", "Ming Xu"),
  });
  await userEvent.click(ming);
  await expect(ming).toHaveAttribute("aria-pressed", "true");
  await waitFor(async () => {
    await expect(canvas.getByRole("heading", { level: 3, name: "Ming Xu" })).toBeVisible();
  });
  await userEvent.click(canvas.getByRole("button", { name: labels.ensembleClose }));
  await expect(
    canvas.queryByRole("heading", { level: 3, name: "Ming Xu" }),
  ).not.toBeInTheDocument();
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Light: Story = { play: interactionPlay };
export const Dark: Story = { globals: { theme: "dark" }, play: interactionPlay };
export const Selected: Story = {
  args: { labels: dictionaries.en.Team, initialMemberSlug: "jianchuan-qi" },
  globals: { locale: "en" },
  render: (args) => (
    <div className="mx-auto max-w-[1280px] p-4 sm:p-8">
      <TeamEnsemble {...args} />
    </div>
  ),
  play: async ({ canvas, canvasElement }) => {
    await expect(canvasElement.querySelectorAll(".team-ensemble-person")).toHaveLength(
      teamMembers.length,
    );
    const jianchuan = canvas.getByRole("button", { name: "Open profile for Jianchuan Qi" });
    await expect(jianchuan).toHaveAttribute("aria-pressed", "true");
    await expect(jianchuan.parentElement).toHaveAttribute("data-band", "front");
    await expect(jianchuan.parentElement).toHaveStyle({ zIndex: "22" });
    await waitFor(async () => {
      await expect(canvas.getByRole("heading", { level: 3, name: "Jianchuan Qi" })).toBeVisible();
    });
  },
};
export const Mobile: Story = { globals: mobileGlobals, play: interactionPlay };

export const CompositionStudio: Story = {
  render: () => <TeamEnsembleEditor />,
  play: async ({ canvas }) => {
    const size = canvas.getByRole("spinbutton", { name: "Size" });
    const original = (size as HTMLInputElement).value;
    await userEvent.click(size);
    await userEvent.clear(size);
    await userEvent.type(size, "28");
    await userEvent.click(canvas.getByRole("button", { name: "Export layout" }));
    const exported = canvas.getByRole("textbox", { name: "Layout JSON" }) as HTMLTextAreaElement;
    await expect(JSON.parse(exported.value)["ming-xu"].width).toBe(28);
    await userEvent.click(canvas.getByRole("button", { name: "Undo" }));
    await expect(size).toHaveValue(Number(original));
    const crop = canvas.getByRole("spinbutton", { name: "Crop right" });
    await userEvent.click(crop);
    await userEvent.clear(crop);
    await userEvent.type(crop, "12");
    await userEvent.click(canvas.getByRole("button", { name: "Export layout" }));
    await expect(JSON.parse(exported.value)["ming-xu"].cropRight).toBe(12);
    const person = canvas.getByRole("button", { name: "Open profile for Ming Xu" }).parentElement!;
    await expect(
      getComputedStyle(person.querySelector(".team-ensemble-portrait")!).clipPath,
    ).toContain("12%");
    await userEvent.click(canvas.getByRole("button", { name: "Undo" }));
    await expect(crop).toHaveValue(0);

    await userEvent.click(canvas.getByRole("button", { name: "Mobile" }));
    await expect(canvas.getByRole("button", { name: "Desktop" })).toBeVisible();
    const composition = person.closest(".team-ensemble")!;
    const bounds = composition.getBoundingClientRect();
    await expect(bounds.width / bounds.height).toBeCloseTo(16 / 9, 1);
    await expect(size).toHaveValue(Number(original));
    await userEvent.click(canvas.getByRole("button", { name: "Export layout" }));
    await expect(JSON.parse(exported.value)["ming-xu"]).not.toHaveProperty("mobileX");
    await userEvent.click(canvas.getByRole("button", { name: "Desktop" }));
  },
};
