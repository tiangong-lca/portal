import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";
import { delay, http, HttpResponse } from "msw";
import { CollectionsWorkspace } from "../../src/features/collections/collections-workspace";
import { collectionsStorageKey } from "../../src/features/collections/storage";
import {
  collectionsStorageKeyV2,
  emptyCollectionStateV2,
  type CollectionStateV2,
} from "../../src/features/collections/storage-v2";
import { collectionSummaryRequestSchema } from "../../src/lib/collection-summaries";
import { dictionaries, mobileGlobals, refs, sampleNames, storyLocale } from "../fixtures";

const summaries = http.post("*/internal/dataset-summaries", async ({ request }) => {
  const { items, locale } = collectionSummaryRequestSchema.parse(await request.json());
  return HttpResponse.json({
    items: items.map((item) => ({
      ...item,
      status: item.kind === null ? "ambiguous" : item.ref === refs[2] ? "unavailable" : "resolved",
      matches:
        item.kind === null
          ? (["process", "flow"] as const).map((kind) => ({
              kind,
              ref: item.ref,
              name: `${sampleNames[locale][1]} · ${kind}`,
            }))
          : item.ref === refs[2]
            ? []
            : [{ ...item, name: sampleNames[locale][0] }],
    })),
  });
});

const meta = {
  title: "Shortlist/Workspace",
  component: CollectionsWorkspace,
  tags: ["!autodocs"],
  argTypes: { labels: { control: false }, common: { control: false }, locale: { control: false } },
  args: {
    locale: "zh-CN",
    labels: dictionaries["zh-CN"].Collections,
    common: dictionaries["zh-CN"].Common,
  },
  parameters: { msw: [summaries] },
  beforeEach({ globals, parameters }) {
    const saved = [collectionsStorageKey, collectionsStorageKeyV2].map(
      (key) => [key, localStorage.getItem(key)] as const,
    );
    for (const [key] of saved) localStorage.removeItem(key);
    const m = dictionaries[storyLocale(globals)].Collections;
    const state: CollectionStateV2 = {
      ...emptyCollectionStateV2,
      researchName: parameters.populated ? `${m.researchName} · Storybook` : "",
      purpose: parameters.populated ? `${m.purpose} · Storybook fixture` : "",
      members: parameters.populated
        ? [
            {
              kind: "process",
              ref: refs[0],
              status: "selected",
              note: `${m.note} · Storybook fixture`,
            },
            { kind: null, ref: refs[1], status: "candidate", note: "" },
            { kind: "flow", ref: refs[2], status: "excluded", note: "" },
          ]
        : [],
    };
    localStorage.setItem(
      collectionsStorageKeyV2,
      parameters.corrupt ? "{broken-fixture" : JSON.stringify(state),
    );
    return () => {
      for (const [key, value] of saved) {
        if (value === null) localStorage.removeItem(key);
        else localStorage.setItem(key, value);
      }
    };
  },
  render: (args, { globals }) => {
    const locale = storyLocale(globals);
    return (
      <CollectionsWorkspace
        {...args}
        key={locale}
        locale={locale}
        labels={dictionaries[locale].Collections}
        common={dictionaries[locale].Common}
      />
    );
  },
} satisfies Meta<typeof CollectionsWorkspace>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {};
export const ResolvedAmbiguousAndMissing: Story = {
  parameters: { populated: true },
  play: async ({ canvas, globals }) => {
    const m = dictionaries[storyLocale(globals)].Collections;
    await expect(await canvas.findByText(m.ambiguous)).toBeVisible();
    await expect(canvas.getByText(m.noPublicVersion)).toBeVisible();
  },
};
export const Loading: Story = {
  parameters: {
    populated: true,
    msw: [
      http.post("*/internal/dataset-summaries", async () => {
        await delay("infinite");
        return HttpResponse.json({ items: [] });
      }),
    ],
  },
};
export const ServiceUnavailable: Story = {
  parameters: {
    populated: true,
    msw: [http.post("*/internal/dataset-summaries", () => HttpResponse.json({}, { status: 503 }))],
  },
  play: async ({ canvas, globals }) => {
    await expect(
      (
        await canvas.findAllByText(dictionaries[storyLocale(globals)].Collections.summaryFailure)
      )[0],
    ).toBeVisible();
  },
};
export const InvalidVersion: Story = {
  play: async ({ canvas, userEvent, globals }) => {
    const m = dictionaries[storyLocale(globals)].Collections;
    const input = canvas.getByRole("textbox", { name: m.memberRef });
    await userEvent.type(input, "invalid-version");
    await userEvent.click(canvas.getByRole("button", { name: m.add }));
    await expect(input).toHaveAttribute("aria-invalid", "true");
    await expect(canvas.getByText(m.invalidRef)).toBeVisible();
  },
};
export const AddAfterCorrection: Story = {
  play: async (context) => {
    await InvalidVersion.play?.(context);
    const { canvas, userEvent, globals } = context;
    const locale = storyLocale(globals);
    const m = dictionaries[locale].Collections;
    const input = canvas.getByRole("textbox", { name: m.memberRef });
    await userEvent.clear(input);
    await userEvent.type(input, refs[0]);
    await userEvent.selectOptions(canvas.getByRole("combobox", { name: m.kind }), "process");
    await expect(input).toHaveAttribute("aria-invalid", "false");
    await expect(canvas.queryByText(m.invalidRef)).not.toBeInTheDocument();
    await userEvent.click(canvas.getByRole("button", { name: m.add }));
    await expect(await canvas.findByRole("link", { name: sampleNames[locale][0] })).toBeVisible();
    await expect(input).toHaveAttribute("aria-invalid", "false");
  },
};
export const CorruptStorage: Story = {
  parameters: { corrupt: true },
  play: async ({ canvas, globals }) => {
    const m = dictionaries[storyLocale(globals)].Collections;
    await expect(await canvas.findByText(m.corruptError)).toBeVisible();
    await expect(canvas.queryByText(m.empty)).not.toBeInTheDocument();
    await expect(canvas.getByRole("textbox", { name: m.memberRef })).toBeDisabled();
    await expect(localStorage.getItem(collectionsStorageKeyV2)).toBe("{broken-fixture");
  },
};
export const MobileGerman: Story = {
  ...ResolvedAmbiguousAndMissing,
  globals: { ...mobileGlobals, locale: "de" },
};
export const DarkFrench: Story = {
  ...ResolvedAmbiguousAndMissing,
  globals: { theme: "dark", locale: "fr" },
};
