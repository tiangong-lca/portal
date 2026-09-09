import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { usePathname } from "@storybook/nextjs-vite/navigation.mock";
import { expect, waitFor } from "storybook/test";
import { BrandHome } from "@/components/brand/brand-home";
import { BrandSculpture } from "@/components/brand/brand-sculpture";
import { SculptureOutline } from "@/components/brand/sculpture-outline";
import { LifecycleSculpture } from "@/components/brand/lifecycle/LifecycleSculpture";
import { loadModelTemplate } from "@/components/brand/lifecycle/model-template";
import { SiteHeader } from "@/components/shell/site-header";
import { SiteFooter } from "@/components/shell/site-footer";
import { publicCatalogSummarySchema } from "@/server/contracts/portal";
import fixture from "../../tests/fixtures/portal/catalog-v1.json";
import { ModelTemplateProvider } from "../brand-exploration/ModelTemplateProvider";
import { dictionaries, mobileGlobals, storyLocale } from "../fixtures";

const summary = publicCatalogSummarySchema.parse(fixture.catalogSummary);

const meta = {
  title: "Brand/Homepage",
  component: BrandHome,
  subcomponents: {
    BrandSculpture,
    LifecycleSculpture,
    SculptureOutline,
    SiteHeader,
    SiteFooter,
    ModelTemplateProvider,
  },
  tags: ["!autodocs"],
  parameters: {
    pageLayout: true,
    viewport: {
      options: {
        wide: { name: "Wide · 1920", styles: { width: "1920px", height: "1080px" } },
        ultrawide: { name: "Ultrawide · 2560", styles: { width: "2560px", height: "1440px" } },
      },
    },
    docs: {
      description: {
        component:
          "Production brand homepage with synthetic catalog summary fixtures. The same runtime sculpture, CSS, dictionaries and navigation are used by the public route. Reference boards are not loaded by this page.",
      },
    },
  },
  args: { summary, locale: "zh-CN" },
  globals: { viewport: { value: "desktop", isRotated: false } },
  beforeEach({ globals }) {
    const key = "tiangong.portal.theme.v1";
    const saved = localStorage.getItem(key);
    localStorage.setItem(key, globals.theme === "dark" ? "dark" : "light");
    usePathname.mockReturnValue(`/${storyLocale(globals)}`);
    return () => {
      if (saved === null) localStorage.removeItem(key);
      else localStorage.setItem(key, saved);
      usePathname.mockReset();
    };
  },
  loaders: [
    async ({ args, globals, parameters }) => {
      const locale = storyLocale(globals);
      const template =
        parameters.artwork === "unavailable" ||
        parameters.artwork === "loading" ||
        parameters.artwork === "lazy"
          ? undefined
          : await loadModelTemplate();
      const sculpture =
        parameters.artwork === "loading" ? (
          <div className="brand-sculpture">
            <SculptureOutline />
          </div>
        ) : parameters.artwork === "lazy" ? (
          <BrandSculpture locale={locale} />
        ) : (
          <LifecycleSculpture
            locale={locale}
            presentation="hero"
            initialTheme={globals.theme === "dark" ? "dark" : "light"}
            reducedMotion={Boolean(parameters.reducedMotion)}
            unavailable={parameters.artwork === "unavailable"}
          />
        );
      const [home, header, footer] = await Promise.all([
        BrandHome({ locale, summary: args.summary ?? null, sculpture }),
        SiteHeader({ locale }),
        SiteFooter({ locale }),
      ]);
      return { home, header, footer, template };
    },
  ],
  render: (_, { loaded }) => (
    <ModelTemplateProvider template={loaded.template}>
      {loaded.header}
      {loaded.home}
      {loaded.footer}
    </ModelTemplateProvider>
  ),
  play: async ({ canvas, canvasElement, globals, parameters }) => {
    const text = dictionaries[storyLocale(globals)].BrandHome;
    await expect(canvas.getByRole("heading", { level: 1 })).toHaveTextContent(
      `${text.titleLead}${storyLocale(globals) === "zh-CN" ? "" : " "}${text.titleFocus}`,
    );
    await expect(canvas.getByRole("link", { name: text.explore })).toHaveAttribute(
      "href",
      "#explore",
    );
    if (parameters.artwork !== "loading" && parameters.artwork !== "unavailable") {
      await waitFor(
        () =>
          expect(canvasElement.querySelector(".lifecycle-study")).toHaveAttribute(
            "data-renderer",
            "ready",
          ),
        { timeout: 15000 },
      );
    }
    await expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(window.innerWidth + 1);
  },
} satisfies Meta<typeof BrandHome>;
export default meta;
type Story = StoryObj<Omit<typeof meta, "component">>;

export const Light: Story = {};
export const Dark: Story = { globals: { theme: "dark" } };
export const WideLight: Story = { globals: { viewport: { value: "wide", isRotated: false } } };
export const WideDark: Story = {
  globals: { theme: "dark", viewport: { value: "wide", isRotated: false } },
};
export const Ultrawide: Story = { globals: { viewport: { value: "ultrawide", isRotated: false } } };
export const English: Story = { globals: { locale: "en" } };
export const FrenchDark: Story = { globals: { locale: "fr", theme: "dark" } };
export const Mobile: Story = { globals: mobileGlobals };
export const MobileDark: Story = { globals: { ...mobileGlobals, theme: "dark" } };
export const GermanMobile: Story = { globals: { ...mobileGlobals, locale: "de" } };
export const ReducedMotion: Story = { parameters: { reducedMotion: true } };
export const LoadingArtwork: Story = { parameters: { artwork: "loading" } };
export const ArtworkUnavailable: Story = { parameters: { artwork: "unavailable" } };
export const SummaryUnavailable: Story = { args: { summary: null } };
export const ProductionLazyLoad: Story = { parameters: { artwork: "lazy" } };
export const ColorAndSiteTheme: Story = {
  globals: { locale: "en" },
  parameters: { artwork: "lazy" },
  play: async ({ canvas, canvasElement, userEvent }) => {
    await waitFor(
      () =>
        expect(canvasElement.querySelector(".lifecycle-study")).toHaveAttribute(
          "data-renderer",
          "ready",
        ),
      { timeout: 15000 },
    );
    const object = canvas.getByRole("button", { name: dictionaries.en.Sculpture.object });
    object.focus();
    await userEvent.keyboard("{Enter}");
    await expect(object).toHaveAttribute("aria-pressed", "true");
    await userEvent.click(canvas.getByRole("radio", { name: "Dark" }));
    await waitFor(() =>
      expect(canvasElement.querySelector(".lifecycle-study")).toHaveAttribute("data-theme", "dark"),
    );
    await expect(object).toHaveAttribute("aria-pressed", "true");
    await expect(
      canvas.queryByRole("button", { name: dictionaries.en.Sculpture.pause }),
    ).not.toBeInTheDocument();
    await expect(
      canvas.queryByRole("button", { name: dictionaries.en.Sculpture.color }),
    ).not.toBeInTheDocument();
    await waitFor(
      () =>
        expect(canvasElement.querySelector(".lifecycle-study")).toHaveAttribute(
          "data-motion",
          "paused",
        ),
      { timeout: 5000 },
    );
    object.focus();
    await userEvent.keyboard(" ");
    await expect(object).toHaveAttribute("aria-pressed", "false");
    await expect(canvasElement.querySelector(".lifecycle-study")).toHaveAttribute(
      "data-motion",
      "running",
    );
    await waitFor(
      () =>
        expect(canvasElement.querySelector(".lifecycle-study")).toHaveAttribute(
          "data-motion",
          "paused",
        ),
      { timeout: 5000 },
    );
  },
};
