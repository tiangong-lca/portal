import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { usePathname } from "@storybook/nextjs-vite/navigation.mock";
import { expect, within } from "storybook/test";

import { SiteFooter } from "@/components/shell/site-footer";
import { SiteHeader } from "@/components/shell/site-header";
import { TeamPageView } from "@/features/team/team-page";
import { teamMembers } from "@/features/team/team-data";

import { dictionaries, mobileGlobals, storyLocale } from "../fixtures";

const meta = {
  title: "Brand/Team",
  component: TeamPageView,
  args: { labels: dictionaries["zh-CN"].Team, locale: "zh-CN" },
  parameters: { pageLayout: true },
  tags: ["!autodocs"],
  beforeEach({ globals }) {
    const key = "tiangong.portal.theme.v1";
    const saved = localStorage.getItem(key);
    localStorage.setItem(key, globals.theme === "dark" ? "dark" : "light");
    usePathname.mockReturnValue(`/${storyLocale(globals)}/team`);
    return () => {
      if (saved === null) localStorage.removeItem(key);
      else localStorage.setItem(key, saved);
      usePathname.mockReset();
    };
  },
  loaders: [
    async ({ globals }) => ({
      header: await SiteHeader({ locale: storyLocale(globals) }),
      footer: await SiteFooter({ locale: storyLocale(globals) }),
    }),
  ],
  render: (_, { globals, loaded }) => (
    <>
      {loaded.header}
      <TeamPageView
        labels={dictionaries[storyLocale(globals)].Team}
        locale={storyLocale(globals)}
      />
      {loaded.footer}
    </>
  ),
  play: async ({ canvas, canvasElement, globals }) => {
    const labels = dictionaries[storyLocale(globals)].Team;
    await expect(canvas.getByRole("heading", { level: 1, name: labels.kicker })).toBeVisible();
    await expect(canvas.getByRole("banner")).toBeVisible();
    await expect(canvas.getByRole("contentinfo")).toBeVisible();
    await expect(canvas.getByRole("heading", { name: labels.communityActionTitle })).toBeVisible();
    await expect(canvas.getByRole("link", { name: labels.communityAction })).toHaveAttribute(
      "href",
      `/${storyLocale(globals)}/community`,
    );
    await expect(canvas.getAllByRole("article")).toHaveLength(teamMembers.length);
    const roster = within(canvasElement.querySelector(".team-roster")!);
    await expect(
      roster.getAllByRole("heading", { level: 3 }).map((heading) => heading.textContent),
    ).toEqual(teamMembers.map((member) => member.name));
    await expect(canvas.getByRole("link", { name: labels.contactAction })).toHaveAttribute(
      "href",
      "mailto:contact@tiangong.earth",
    );
  },
} satisfies Meta<typeof TeamPageView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Light: Story = {};
export const Dark: Story = { globals: { theme: "dark" } };
export const English: Story = { globals: { locale: "en" } };
export const Mobile: Story = { globals: mobileGlobals };
export const MobileGerman: Story = { globals: { ...mobileGlobals, locale: "de" } };
export const DarkFrench: Story = { globals: { locale: "fr", theme: "dark" } };
