import { CollectionsPageView } from "../../src/features/collections/collections-page-view";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, spyOn, waitFor, within } from "storybook/test";
import { delay, http, HttpResponse } from "msw";
import { CollectionsWorkspace } from "../../src/features/collections/collections-workspace";
import { collectionsStorageKey } from "../../src/features/collections/storage";
import {
  collectionsStorageKeyV2,
  emptyCollectionStateV2,
  encodeDisclosedCollectionFragmentV2,
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
  subcomponents: { CollectionsPageView },
  tags: ["!autodocs"],
  argTypes: { labels: { control: false }, common: { control: false }, locale: { control: false } },
  args: {
    locale: "zh-CN",
    labels: dictionaries["zh-CN"].Collections,
    common: dictionaries["zh-CN"].Common,
  },
  parameters: { pageLayout: true, msw: [summaries] },
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
    if (parameters.atLimit)
      state.members = Array.from({ length: 200 }, (_, index) => ({
        kind: "process",
        ref: `${refs[0].split("@")[0]}@01.00.${String(index).padStart(3, "0")}`,
        status: "candidate",
        note: "",
      }));
    if (parameters.disclosed)
      window.history.replaceState(
        null,
        "",
        `${window.location.pathname}${window.location.search}${encodeDisclosedCollectionFragmentV2(importedState)}`,
      );
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
      <CollectionsPageView
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
    await userEvent.click(canvas.getByText(m.add, { selector: "summary" }));
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

const importedState: CollectionStateV2 = {
  ...emptyCollectionStateV2,
  researchName: "Imported Storybook research",
  purpose: "Synthetic import preview",
  members: [{ kind: "flow", ref: refs[4], status: "candidate", note: "Private synthetic note" }],
};
export const ImportPreview: Story = {
  parameters: { populated: true },
  play: async ({ canvas, userEvent, globals }) => {
    const m = dictionaries[storyLocale(globals)].Collections;
    const field = canvas.getByRole("textbox", { name: m.researchName });
    await waitFor(() => expect(field).toHaveValue(`${m.researchName} · Storybook`));
    const before = localStorage.getItem(collectionsStorageKeyV2);
    await userEvent.upload(
      canvas.getByLabelText(m.import),
      new File([JSON.stringify(importedState)], "storybook-shortlist.json", {
        type: "application/json",
      }),
    );
    const preview = await canvas.findByRole("region", { name: m.importTitle });
    await expect(preview).toHaveTextContent(importedState.researchName);
    await expect(preview).toHaveTextContent(importedState.members[0]!.note);
    await expect(field).toHaveValue(`${m.researchName} · Storybook`);
    await expect(localStorage.getItem(collectionsStorageKeyV2)).toBe(before);
  },
};
export const CancelImport: Story = {
  ...ImportPreview,
  play: async (context) => {
    await ImportPreview.play?.(context);
    const { canvas, userEvent, globals } = context;
    const m = dictionaries[storyLocale(globals)].Collections;
    const before = localStorage.getItem(collectionsStorageKeyV2);
    await userEvent.click(
      within(canvas.getByRole("region", { name: m.importTitle })).getByRole("button", {
        name: m.shareCancel,
      }),
    );
    await expect(canvas.queryByRole("region", { name: m.importTitle })).not.toBeInTheDocument();
    await expect(localStorage.getItem(collectionsStorageKeyV2)).toBe(before);
  },
};
export const ConfirmImport: Story = {
  ...ImportPreview,
  play: async (context) => {
    await ImportPreview.play?.(context);
    const { canvas, userEvent, globals } = context;
    const m = dictionaries[storyLocale(globals)].Collections;
    await userEvent.click(canvas.getByRole("button", { name: m.importConfirm }));
    await expect(canvas.getByRole("textbox", { name: m.researchName })).toHaveValue(
      importedState.researchName,
    );
    await waitFor(() =>
      expect(JSON.parse(localStorage.getItem(collectionsStorageKeyV2)!)).toEqual(importedState),
    );
    await expect(canvas.queryByRole("region", { name: m.importTitle })).not.toBeInTheDocument();
  },
};
export const CancelDisclosedLink: Story = {
  parameters: { populated: true, disclosed: true },
  play: async ({ canvas, userEvent, globals }) => {
    const m = dictionaries[storyLocale(globals)].Collections;
    const preview = await canvas.findByRole("region", { name: m.importTitle });
    await expect(preview).toHaveTextContent(importedState.members[0]!.note);
    const before = localStorage.getItem(collectionsStorageKeyV2);
    await userEvent.click(within(preview).getByRole("button", { name: m.shareCancel }));
    await expect(canvas.queryByRole("region", { name: m.importTitle })).not.toBeInTheDocument();
    await expect(localStorage.getItem(collectionsStorageKeyV2)).toBe(before);
  },
};
export const CancelSharingNotes: Story = {
  parameters: { populated: true },
  play: async ({ canvas, userEvent, globals }) => {
    const m = dictionaries[storyLocale(globals)].Collections;
    const clipboard = spyOn(navigator.clipboard, "writeText").mockResolvedValue();
    try {
      await userEvent.click(canvas.getByRole("button", { name: m.shareWithNotes }));
      const preview = await canvas.findByRole("region", { name: m.sharePreview });
      await expect(preview).toHaveTextContent(`${m.note} · Storybook fixture`);
      await expect(clipboard).not.toHaveBeenCalled();
      await userEvent.click(within(preview).getByRole("button", { name: m.shareCancel }));
      await expect(canvas.queryByRole("region", { name: m.sharePreview })).not.toBeInTheDocument();
      await expect(clipboard).not.toHaveBeenCalled();
    } finally {
      clipboard.mockRestore();
    }
  },
};
export const MemberLimit: Story = {
  parameters: { atLimit: true },
  play: async ({ canvas, userEvent, globals }) => {
    const m = dictionaries[storyLocale(globals)].Collections;
    await userEvent.type(canvas.getByRole("textbox", { name: m.memberRef }), refs[4]);
    await userEvent.click(canvas.getByRole("button", { name: m.add }));
    await expect(await canvas.findByText(m.memberLimit)).toBeVisible();
    await expect(JSON.parse(localStorage.getItem(collectionsStorageKeyV2)!).members).toHaveLength(
      200,
    );
    await userEvent.click(canvas.getByRole("button", { name: m.share }));
    await expect(canvas.getByText(m.shareLimit)).toBeVisible();
    await expect(canvas.getByRole("button", { name: m.export })).toBeEnabled();
  },
};
export const MobileGermanImport: Story = {
  ...ConfirmImport,
  globals: { ...mobileGlobals, locale: "de" },
};
export const DarkFrenchSharing: Story = {
  ...CancelSharingNotes,
  globals: { ...mobileGlobals, locale: "fr", theme: "dark" },
};
