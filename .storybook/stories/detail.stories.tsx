import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { usePathname } from "@storybook/nextjs-vite/navigation.mock";
import { expect, spyOn, waitFor } from "storybook/test";
import { DetailHeader } from "../../src/features/catalog/detail-header";
import { CitationCopy } from "../../src/features/catalog/citation-copy";
import { OverviewPanel } from "../../src/features/catalog/overview-panel";
import { VersionsPanel } from "../../src/features/catalog/versions-panel";
import { LciaPanel } from "../../src/features/catalog/lcia-panel";
import { CompareSelectionProvider } from "../../src/features/compare/selection";
import { dictionaries, mobileGlobals, refs, selectionLabels, storyLocale } from "../fixtures";
import { detailRecord, lciaLabels, lciaResult } from "../composition-fixtures";

const meta = {
  component: DetailHeader,
  subcomponents: {
    CompareSelectionProvider,
    OverviewPanel,
    VersionsPanel,
    LciaPanel,
    CitationCopy,
  },
  title: "Catalog/Dataset detail",
  tags: ["!autodocs"],
  beforeEach({ globals, parameters }) {
    const locale = storyLocale(globals);
    const kind = parameters.flow ? "flow" : "process";
    usePathname.mockReturnValue(
      `/${locale}/${kind}/${encodeURIComponent(refs[parameters.flow ? 2 : 0])}${parameters.panel ? `/${parameters.panel}` : ""}`,
    );
    return () => usePathname.mockReset();
  },
  loaders: [
    async ({ globals, parameters }) => {
      const locale = storyLocale(globals);
      const kind = parameters.flow ? "flow" : "process";
      const record = parameters.missing ? undefined : detailRecord(locale, kind);
      return {
        header: await DetailHeader({
          locale,
          kind,
          refValue: refs[parameters.flow ? 2 : 0],
          record,
        }),
        overview: await OverviewPanel({ locale, record }),
      };
    },
  ],
  render: (_, { globals, parameters, loaded }) => {
    const locale = storyLocale(globals);
    const m = dictionaries[locale].Detail;
    return (
      <CompareSelectionProvider locale={locale} labels={selectionLabels(locale)}>
        <div className="mx-auto flex max-w-7xl flex-col gap-8">
          {loaded.header}
          {parameters.panel === "lcia" ? (
            <LciaPanel
              locale={locale}
              labels={lciaLabels(locale)}
              result={
                parameters.unavailable
                  ? { status: "unavailable" }
                  : parameters.failure
                    ? { status: "temporarily_unavailable" }
                    : lciaResult(locale)
              }
            />
          ) : parameters.panel === "versions" ? (
            <VersionsPanel
              locale={locale}
              currentRef={refs[0]}
              labels={{ view: dictionaries[locale].Common.viewVersion, current: m.currentVersion }}
              emptyTitle={m.versions}
              emptyDescription={m.versionsEmpty}
              rows={
                parameters.empty
                  ? []
                  : ["01.01.000", "01.00.000", "00.99.999"].map((version, index) => {
                      const ref = `${refs[0].split("@")[0]}@${version}`;
                      return {
                        ref,
                        version,
                        isLatest: index === 0,
                        modifiedAt: `202${6 - index}-01-01T00:00:00Z`,
                        summary: detailRecord(locale, "process").name,
                        href: `/${locale}/process/${encodeURIComponent(ref)}`,
                      };
                    })
              }
            />
          ) : (
            loaded.overview
          )}
        </div>
      </CompareSelectionProvider>
    );
  },
} satisfies Meta;
export default meta;
type Story = StoryObj<Omit<typeof meta, "component">>;
export const Process: Story = {
  play: async ({ canvas, globals }) => {
    const locale = storyLocale(globals);
    const m = dictionaries[locale].Detail;
    await expect(canvas.getByRole("heading", { level: 1 })).toHaveTextContent(
      detailRecord(locale, "process").name,
    );
    const title = canvas.getByRole("heading", { level: 1 });
    await expect(title.scrollWidth).toBeLessThanOrEqual(title.clientWidth);
    await expect(canvas.getByRole("link", { name: m.overview })).toHaveAttribute(
      "aria-current",
      "page",
    );
    await expect(canvas.getByRole("link", { name: m.citation })).toHaveAttribute(
      "href",
      "#citation",
    );
    await expect(
      canvas.getByText(m.citation, { selector: "summary" }).closest("details"),
    ).not.toHaveAttribute("open");
  },
};
export const Flow: Story = {
  parameters: { flow: true },
  play: async ({ canvas, globals }) => {
    const m = dictionaries[storyLocale(globals)].Detail;
    await expect(canvas.getByText("124-38-9")).toBeVisible();
    await expect(canvas.queryByText(m.functionalUnit)).not.toBeInTheDocument();
    await expect(canvas.queryByRole("link", { name: m.lcia })).not.toBeInTheDocument();
  },
};
export const MissingMetadata: Story = { parameters: { missing: true } };
export const MobileGerman: Story = { ...Process, globals: { ...mobileGlobals, locale: "de" } };
export const DarkFrenchFlow: Story = {
  ...Flow,
  globals: { ...mobileGlobals, locale: "fr", theme: "dark" },
};
export const Versions: Story = {
  parameters: { panel: "versions" },
  play: async ({ canvas, globals }) => {
    const locale = storyLocale(globals);
    const m = dictionaries[locale].Detail;
    await expect(canvas.getByText(m.currentVersion)).toBeVisible();
    const links = canvas.getAllByRole("link", { name: dictionaries[locale].Common.viewVersion });
    await expect(links).toHaveLength(3);
    await expect(links[2]).toHaveAttribute("href", expect.stringContaining("%4000.99.999"));
  },
};
export const EmptyVersions: Story = { parameters: { panel: "versions", empty: true } };
export const MobileFrenchVersions: Story = {
  ...Versions,
  globals: { ...mobileGlobals, locale: "fr" },
};
export const Lcia: Story = { parameters: { panel: "lcia" } };
export const MobileGermanLcia: Story = { ...Lcia, globals: { ...mobileGlobals, locale: "de" } };
export const DarkFrenchLcia: Story = { ...Lcia, globals: { locale: "fr", theme: "dark" } };
export const LciaPublication: Story = {
  ...Lcia,
  play: async ({ canvas, userEvent, globals }) => {
    const m = dictionaries[storyLocale(globals)].Detail;
    await userEvent.click(canvas.getByText(m.releaseDetails));
    await expect(
      canvas.getByText(lciaResult(storyLocale(globals)).publication.evidenceHash),
    ).toBeVisible();
  },
};
export const LciaResultContext: Story = {
  ...Lcia,
  play: async ({ canvas, userEvent, globals }) => {
    const locale = storyLocale(globals);
    const m = dictionaries[locale].Detail;
    const row = lciaResult(locale).rows[0]!;
    const value = canvas
      .getAllByText(row.value)
      .find((element) => element.getBoundingClientRect().width > 0)!;
    const range = document.createRange();
    range.selectNodeContents(value);
    await expect(range.getClientRects()).toHaveLength(1);
    const summary = canvas
      .getAllByText(m.lciaContext)
      .find(
        (element) => element.tagName === "SUMMARY" && element.getBoundingClientRect().height > 0,
      )!;
    const disclosure = summary.closest("details")!;
    await expect(disclosure).not.toHaveAttribute("open");
    await userEvent.click(summary);
    await waitFor(() => expect(disclosure).toHaveAttribute("open"));
    await expect(disclosure).toHaveTextContent(row.processRef);
    await expect(disclosure).toHaveTextContent(row.methodRef);
    await expect(value).toHaveTextContent(row.value);
  },
};
export const MobileFrenchLciaContext: Story = {
  ...LciaResultContext,
  globals: { ...mobileGlobals, locale: "fr", theme: "dark" },
};
export const LciaUnavailable: Story = { parameters: { panel: "lcia", unavailable: true } };
export const LciaFailure: Story = { parameters: { panel: "lcia", failure: true } };

export const CitationExpanded: Story = {
  play: async ({ canvas, userEvent, globals }) => {
    const m = dictionaries[storyLocale(globals)].Detail;
    await userEvent.click(canvas.getByText(m.citation, { selector: "summary" }));
    await expect(canvas.getByRole("button", { name: m.copyVersionId })).toBeVisible();
    await expect(
      canvas.getByText(detailRecord(storyLocale(globals), "process").citation!),
    ).toBeVisible();
  },
};
export const CitationExpandedMobile: Story = {
  ...CitationExpanded,
  globals: { ...mobileGlobals, locale: "de" },
};
export const ProcessDark: Story = { ...Process, globals: { locale: "fr", theme: "dark" } };
export const CitationCopyAndDenial: Story = {
  play: async ({ canvas, userEvent, globals }) => {
    const m = dictionaries[storyLocale(globals)].Detail;
    await userEvent.click(canvas.getByText(m.citation, { selector: "summary" }));
    const copy = spyOn(navigator.clipboard, "writeText")
      .mockResolvedValueOnce()
      .mockRejectedValueOnce(new Error("Clipboard denied"));
    try {
      await userEvent.click(canvas.getByRole("button", { name: m.copyVersionId }));
      await expect(copy).toHaveBeenCalledWith(refs[0]);
      await userEvent.click(canvas.getByRole("button", { name: m.copyCitation }));
      await expect(canvas.findByRole("alert")).resolves.toHaveTextContent(m.copyFailed);
      await expect(
        canvas.getAllByText(detailRecord(storyLocale(globals), "process").citation!).length,
      ).toBeGreaterThan(0);
    } finally {
      copy.mockRestore();
    }
  },
};
