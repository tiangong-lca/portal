import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";
import {
  CompareChoice,
  CompareSelectionProvider,
  CompareSelectionSeed,
} from "../../src/features/compare/selection";
import { CompareWorkbench } from "../../src/features/compare/compare-workbench";
import {
  compareCandidates,
  compareLabels,
  dictionaries,
  mobileGlobals,
  refs,
  sampleNames,
  selectionLabels,
  storyLocale,
} from "../fixtures";

const meta = { title: "Compare/Workbench", tags: ["!autodocs"] } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

export const MatchingFields: Story = {
  render: (_, { globals, parameters }) => {
    const locale = storyLocale(globals);
    const candidates = compareCandidates(locale);
    if (parameters.missing && candidates[1]) delete candidates[1].cutoffRule;
    if (parameters.incompatible && candidates[1]) candidates[1].referenceUnit = "kg";
    if (parameters.referenceOnly && candidates[1]) candidates[1].referenceYear = "2018";
    if (parameters.converted && candidates[1]) {
      candidates[1].referenceUnit = "MWh";
      for (const candidate of candidates)
        candidate.conversion = { contractRef: "fixture-conversion@1", dimension: "energy" };
    }
    return (
      <CompareWorkbench
        candidates={parameters.empty ? [] : candidates}
        labels={compareLabels(locale)}
        locale={locale}
        numericContext={{
          evidenceHash: "fixture-evidence-only",
          impactName: "Climate change (fixture)",
          methodRef: "fixture-method@1",
          packageRef: "fixture-package@1",
          publicationRef: "fixture-publication@1",
          publishedAt: "2026-01-01",
          unit: "kg CO₂ eq",
        }}
      />
    );
  },
};
export const MissingEvidence: Story = { ...MatchingFields, parameters: { missing: true } };
export const Incompatible: Story = { ...MatchingFields, parameters: { incompatible: true } };
export const FurtherAssessment: Story = { ...MatchingFields, parameters: { referenceOnly: true } };
export const Conversion: Story = { ...MatchingFields, parameters: { converted: true } };
export const Empty: Story = { ...MatchingFields, parameters: { empty: true } };
export const MobileGerman: Story = {
  ...MissingEvidence,
  globals: { ...mobileGlobals, locale: "de" },
};
export const Dark: Story = { ...MatchingFields, globals: { theme: "dark" } };
export const SelectionTray: Story = {
  render: (_, { globals, parameters }) => {
    const locale = storyLocale(globals);
    const items = refs.map((ref, index) => ({
      ref,
      name: `${sampleNames[locale][0]} · ${index + 1}`,
    }));
    return (
      <CompareSelectionProvider locale={locale} labels={selectionLabels(locale)}>
        <CompareSelectionSeed items={items.slice(0, parameters.full ? 4 : 1)} />
        <div className="flex flex-col items-start gap-3">
          {items.map((item) => (
            <section className="flex flex-col gap-2 rounded-xl border p-4" key={item.ref}>
              <h2>{item.name}</h2>
              <CompareChoice
                item={item}
                label={dictionaries[locale].Detail.compare}
                locale={locale}
              />
            </section>
          ))}
        </div>
      </CompareSelectionProvider>
    );
  },
};
export const SelectionLimit: Story = {
  ...SelectionTray,
  parameters: { full: true },
  play: async ({ canvas, userEvent, globals }) => {
    const m = dictionaries[storyLocale(globals)];
    await userEvent.click(canvas.getAllByRole("button", { name: m.Detail.compare })[4]!);
    await expect(canvas.getByRole("alert")).toHaveTextContent(m.Compare.limitReached);
    await expect(canvas.getByRole("status")).toHaveTextContent(
      m.Compare.selectionCount.replace("{count}", "4"),
    );
  },
};
export const MobileTray: Story = { ...SelectionTray, globals: mobileGlobals };
