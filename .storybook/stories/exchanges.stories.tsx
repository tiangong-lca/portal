import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";
import { ExchangesPanel } from "../../src/features/catalog/exchanges-panel";
import { HashDisclosure } from "../../src/components/shell/hash-disclosure";
import { dictionaries, exchangeRows, mobileGlobals, storyLocale } from "../fixtures";

const meta = { title: "Catalog/Exchanges and disclosure" } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;
export const DataTable: Story = {
  render: (_, { globals, parameters }) => {
    const locale = storyLocale(globals);
    const { Common: c, Detail: d } = dictionaries[locale];
    return (
      <ExchangesPanel
        caption={d.exchangesTitle}
        emptyDescription={d.exchangesEmpty}
        emptyTitle={d.exchangesTitle}
        labels={{
          amount: d.value,
          direction: d.direction,
          flow: c.flow,
          functionalUnit: d.functionalUnit,
          kind: d.exchangeKind,
          policy: d.policyVersion,
          process: c.process,
          quantitativeReference: d.quantitativeReference,
          yes: d.yes,
          no: d.no,
        }}
        rows={parameters.empty ? [] : exchangeRows(locale)}
        locale={locale}
      />
    );
  },
};
export const Empty: Story = { ...DataTable, parameters: { empty: true } };
export const MobileFrench: Story = { ...DataTable, globals: { ...mobileGlobals, locale: "fr" } };
export const Dark: Story = { ...DataTable, globals: { theme: "dark" } };
export const EvidenceDisclosure: Story = {
  render: (_, { globals }) => {
    const m = dictionaries[storyLocale(globals)].Detail;
    return (
      <HashDisclosure id="storybook-evidence" label={m.releaseDetails}>
        <dl>
          <dt>{m.verificationCode}</dt>
          <dd className="font-mono text-xs break-all">{"abcdef0123456789".repeat(4)}</dd>
        </dl>
      </HashDisclosure>
    );
  },
  play: async ({ canvas, userEvent, globals }) => {
    const m = dictionaries[storyLocale(globals)].Detail;
    await userEvent.click(canvas.getByText(m.releaseDetails));
    await expect(canvas.getByText(m.verificationCode)).toBeVisible();
  },
};
