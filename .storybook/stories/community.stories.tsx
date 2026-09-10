import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { usePathname } from "@storybook/nextjs-vite/navigation.mock";
import { expect, userEvent, waitFor } from "storybook/test";

import { SiteFooter } from "@/components/shell/site-footer";
import { SiteHeader } from "@/components/shell/site-header";
import { CommunityPageView } from "@/features/team/community-page";

import { dictionaries, mobileGlobals, storyLocale } from "../fixtures";

const meta = {
  title: "Brand/Community",
  component: CommunityPageView,
  args: { labels: dictionaries["zh-CN"].Community, locale: "zh-CN" },
  parameters: { pageLayout: true },
  tags: ["!autodocs"],
  beforeEach({ globals }) {
    usePathname.mockReturnValue(`/${storyLocale(globals)}/community`);
    return () => usePathname.mockReset();
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
      <CommunityPageView
        labels={dictionaries[storyLocale(globals)].Community}
        locale={storyLocale(globals)}
      />
      {loaded.footer}
    </>
  ),
  play: async ({ canvas, canvasElement, globals }) => {
    const labels = dictionaries[storyLocale(globals)].Community;
    await expect(canvas.getByRole("heading", { level: 1, name: labels.title })).toBeVisible();
    await expect(canvas.getByRole("banner")).toBeVisible();
    await expect(canvas.getByRole("contentinfo")).toBeVisible();
    const directory = canvasElement.querySelector(".team-community")!;
    await expect(directory.querySelectorAll("ul")).toHaveLength(3);
    const headings = Array.from(directory.querySelectorAll(".community-group-heading h2")).map(
      (heading) => heading.textContent,
    );
    await expect(headings).toEqual([labels.domainExperts, labels.partners, labels.contributors]);

    await userEvent.click(
      canvas.getByRole("button", {
        name: labels.showAllContributors.replace("{count}", "155"),
      }),
    );
    await waitFor(async () => {
      await expect(
        canvas.getAllByRole("heading", { level: 3, name: /Ruixi Zhu|朱睿希/ })[0],
      ).toBeVisible();
    });
    await expect(canvas.getByRole("button", { name: labels.hideContributors })).toBeVisible();
    await userEvent.click(canvas.getByRole("button", { name: labels.hideContributors }));
    await expect(
      canvas.queryByRole("heading", { level: 3, name: /Ruixi Zhu|朱睿希/ }),
    ).not.toBeInTheDocument();
  },
} satisfies Meta<typeof CommunityPageView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Light: Story = {};
export const Dark: Story = { globals: { theme: "dark" } };
export const Mobile: Story = { globals: mobileGlobals };
