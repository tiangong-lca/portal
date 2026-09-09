import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { SectionEyebrow } from "@/components/brand/section-eyebrow";
import { dictionaries, mobileGlobals, storyLocale } from "../fixtures";

const meta = {
  title: "Brand/Section Eyebrow",
  component: SectionEyebrow,
  args: { number: "01", children: "天工 LCA · 生命周期智能" },
  render: (args, { globals }) => (
    <SectionEyebrow {...args}>
      {dictionaries[storyLocale(globals)].BrandHome.eyebrow}
    </SectionEyebrow>
  ),
} satisfies Meta<typeof SectionEyebrow>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Light: Story = { globals: { theme: "light" } };
export const Dark: Story = { globals: { theme: "dark" } };
export const Chapters: Story = {
  render: (_, { globals }) => {
    const t = dictionaries[storyLocale(globals)].BrandHome;
    return (
      <div>
        <SectionEyebrow number="01">{t.eyebrow}</SectionEyebrow>
        <SectionEyebrow number="02">{t.catalogKicker}</SectionEyebrow>
        <SectionEyebrow number="03">{t.understandingKicker}</SectionEyebrow>
      </div>
    );
  },
};
export const LongLabelMobile: Story = {
  globals: { ...mobileGlobals, locale: "de" },
  render: (args, { globals }) => (
    <div style={{ maxWidth: 220 }}>
      <SectionEyebrow {...args}>
        {dictionaries[storyLocale(globals)].BrandHome.eyebrow}
      </SectionEyebrow>
    </div>
  ),
};
