import type { Meta, StoryObj } from "@storybook/nextjs-vite";

const meta = {
  title: "Foundations/Portal tokens",
  parameters: {
    docs: {
      description: {
        component:
          "Production globals.css and generated brand tokens. Use the theme and locale toolbar to review real component states; this inventory does not mark existing UI as design-approved.",
      },
    },
  },
} satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;
export const SemanticColors: Story = {
  tags: ["a11y-pending"],
  parameters: {
    a11y: { test: "todo" },
    docs: {
      description: {
        story:
          "Known light-theme muted-text contrast failure (4.34:1). Tracked in [Portal #55](https://github.com/tiangong-lca/portal/issues/55); preserve this diagnostic until the token pairing is corrected.",
      },
    },
  },
  render: () => (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {[
        ["Primary", "bg-primary text-primary-foreground"],
        ["Secondary", "bg-secondary text-secondary-foreground"],
        ["Card", "bg-card text-card-foreground"],
        ["Muted", "bg-muted text-muted-foreground"],
        ["Accent", "bg-accent text-accent-foreground"],
        ["Popover", "bg-popover text-popover-foreground"],
      ].map(([label, className]) => (
        <section className={`rounded-xl border p-6 ${className}`} key={label}>
          <h2 className="font-semibold">{label}</h2>
          <p className="mt-3">天工 LCA · TianGong · Ökobilanz · Électricité</p>
          <p className="mt-2 font-mono text-sm">0.005 kg CO₂ eq</p>
        </section>
      ))}
    </div>
  ),
};
export const Dark: Story = {
  ...SemanticColors,
  tags: ["!a11y-pending"],
  parameters: { a11y: { test: "error" } },
  globals: { theme: "dark" },
};
