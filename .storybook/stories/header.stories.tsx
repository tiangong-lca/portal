import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { usePathname } from "@storybook/nextjs-vite/navigation.mock";
import { expect, waitFor, within } from "storybook/test";
import { SiteHeader } from "../../src/components/shell/site-header";
import { dictionaries, mobileGlobals, storyLocale } from "../fixtures";

const meta = {
  title: "Shell/Site header",
  tags: ["!autodocs"],
  parameters: { pageLayout: true },
  beforeEach({ globals }) {
    const key = "tiangong.portal.theme.v1";
    const saved = localStorage.getItem(key);
    localStorage.setItem(key, globals.theme === "dark" ? "dark" : "light");
    usePathname.mockReturnValue(`/${storyLocale(globals)}/search`);
    return () => {
      if (saved === null) localStorage.removeItem(key);
      else localStorage.setItem(key, saved);
      usePathname.mockReset();
    };
  },
  loaders: [
    async ({ globals }) => ({ header: await SiteHeader({ locale: storyLocale(globals) }) }),
  ],
  render: (_, { loaded, globals }) => (
    <>
      {loaded.header}
      <main id="main-content" tabIndex={-1} className="mx-auto max-w-7xl p-4 sm:p-6">
        <h1 className="font-heading text-3xl font-semibold">
          {dictionaries[storyLocale(globals)].Search.title}
        </h1>
        <p className="text-muted-foreground mt-3">
          {dictionaries[storyLocale(globals)].Search.description}
        </p>
      </main>
    </>
  ),
} satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;
export const Desktop: Story = {
  globals: { viewport: { value: "desktop", isRotated: false } },
  play: async ({ canvas, globals }) => {
    await expect(
      canvas.getByRole("link", { name: dictionaries[storyLocale(globals)].Common.search }),
    ).toHaveAttribute("aria-current", "page");
  },
};
export const KeyboardSkip: Story = {
  ...Desktop,
  play: async ({ canvas, userEvent, globals }) => {
    await userEvent.tab();
    const skip = canvas.getByRole("link", {
      name: dictionaries[storyLocale(globals)].Common.skipToContent,
    });
    await expect(skip).toHaveFocus();
    await expect(skip).toHaveAttribute("href", "#main-content");
    await expect(canvas.getByRole("main")).toHaveAttribute("id", "main-content");
  },
};
export const MobileGerman: Story = {
  globals: { ...mobileGlobals, locale: "de" },
  play: async ({ canvas, canvasElement, userEvent, globals }) => {
    const m = dictionaries[storyLocale(globals)].Common;
    const language = canvas.getByRole("combobox", { name: m.language });
    await userEvent.click(language);
    const body = within(canvasElement.ownerDocument.body);
    await expect(body.getAllByRole("option")).toHaveLength(4);
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(language).toHaveFocus());
    const theme = canvas.getByRole("combobox", { name: m.theme });
    await userEvent.click(theme);
    await userEvent.click(body.getByRole("option", { name: m.themeDark }));
    await expect(document.documentElement).toHaveClass("dark");
    await waitFor(() => expect(theme).toHaveFocus());
    await userEvent.click(theme);
    await userEvent.click(body.getByRole("option", { name: m.themeLight }));
    await expect(document.documentElement).not.toHaveClass("dark");
    await waitFor(() =>
      expect(body.queryByRole("listbox", { hidden: true })).not.toBeInTheDocument(),
    );
  },
};
export const DarkFrench: Story = {
  ...Desktop,
  globals: { locale: "fr", theme: "dark", viewport: { value: "desktop", isRotated: false } },
};
export const LanguageMenu: Story = {
  globals: { ...mobileGlobals, locale: "fr" },
  play: async ({ canvas, canvasElement, userEvent, globals }) => {
    const label = dictionaries[storyLocale(globals)].Common.language;
    await userEvent.click(canvas.getByRole("combobox", { name: label }));
    const body = within(canvasElement.ownerDocument.body);
    await waitFor(() => expect(body.getByRole("listbox", { name: label })).toBeVisible());
    await waitFor(() => expect(body.getByRole("option", { selected: true })).toHaveFocus());
    await Promise.all(
      body
        .getByRole("listbox", { name: label })
        .getAnimations({ subtree: true })
        .map((animation) => animation.finished.catch(() => undefined)),
    );
  },
};
export const ThemeMenu: Story = {
  globals: { ...mobileGlobals, locale: "de", theme: "dark" },
  play: async ({ canvas, canvasElement, userEvent, globals }) => {
    const label = dictionaries[storyLocale(globals)].Common.theme;
    await userEvent.click(canvas.getByRole("combobox", { name: label }));
    const body = within(canvasElement.ownerDocument.body);
    await waitFor(() => expect(body.getByRole("listbox", { name: label })).toBeVisible());
    await waitFor(() => expect(body.getByRole("option", { selected: true })).toHaveFocus());
    await Promise.all(
      body
        .getByRole("listbox", { name: label })
        .getAnimations({ subtree: true })
        .map((animation) => animation.finished.catch(() => undefined)),
    );
  },
};
