import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, waitFor } from "storybook/test";
import { LifecycleSculpture } from "../brand-exploration/LifecycleSculpture";
import { ReferenceComparison } from "../brand-exploration/ReferenceComparison";
import { loadModelTemplate } from "../brand-exploration/model-template";
import { ModelTemplateProvider } from "../brand-exploration/ModelTemplateProvider";
import { storyLocale } from "../fixtures";

const nextPaint = () =>
  new Promise<void>((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
  );
const rendered = async (element: HTMLElement) => {
  await waitFor(
    () =>
      expect(element.querySelector(".lifecycle-study")).toHaveAttribute("data-renderer", "ready"),
    { timeout: 15000 },
  );
  await nextPaint();
};
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const frameCount = (element: HTMLElement) =>
  element.querySelector(".lifecycle-canvas")!.getAttribute("data-frame");

const meta = {
  title: "Brand Explorations/Lifecycle Sculpture",
  component: LifecycleSculpture,
  subcomponents: { ReferenceComparison, ModelTemplateProvider },
  parameters: { pageLayout: true },
  args: { initialTheme: "dark", initialColorful: false },
  loaders: [
    async ({ args }) => ({
      modelTemplate:
        !args.unavailable && !args.assetUrl
          ? await loadModelTemplate().catch(() => undefined)
          : undefined,
    }),
  ],
  render: (args, { globals, loaded }) => (
    <ModelTemplateProvider template={loaded.modelTemplate}>
      <LifecycleSculpture key={JSON.stringify(args)} {...args} locale={storyLocale(globals)} />
    </ModelTemplateProvider>
  ),
  play: async ({ canvasElement }) => rendered(canvasElement),
} satisfies Meta<typeof LifecycleSculpture>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Dark: Story = {};
export const Light: Story = { args: { initialTheme: "light" } };
export const Multicolor: Story = { args: { initialColorful: true } };
export const LightMulticolor: Story = { args: { initialTheme: "light", initialColorful: true } };
export const Mobile: Story = { globals: { viewport: { value: "mobile", isRotated: false } } };
export const MobileLight: Story = {
  args: { initialTheme: "light" },
  globals: { viewport: { value: "mobile", isRotated: false } },
};
export const CompactViewport: Story = {
  parameters: {
    viewport: {
      options: { compact: { name: "Compact review", styles: { width: "476px", height: "316px" } } },
    },
  },
  globals: { viewport: { value: "compact", isRotated: false } },
  play: async ({ canvasElement }) => {
    await rendered(canvasElement);
    const bounds = canvasElement.querySelector(".lifecycle-object")!.getBoundingClientRect();
    const viewport = canvasElement.ownerDocument.defaultView!;
    await expect(bounds.top).toBeGreaterThanOrEqual(0);
    await expect(bounds.bottom).toBeLessThanOrEqual(viewport.innerHeight + 1);
    await expect(bounds.height).toBeGreaterThan(150);
  },
};
export const ReducedMotion: Story = {
  args: { reducedMotion: true },
  globals: { locale: "zh-CN" },
  play: async ({ canvas, canvasElement }) => {
    await rendered(canvasElement);
    await expect(canvas.getByRole("button", { name: "暂停动效" })).toBeDisabled();
    const before = frameCount(canvasElement);
    await delay(250);
    await expect(frameCount(canvasElement)).toBe(before);
    await userEvent.click(canvas.getByRole("button", { name: "多彩模式" }));
    await nextPaint();
    await expect(canvasElement.querySelector(".lifecycle-study")).toHaveAttribute(
      "data-color",
      "multi",
    );
    const changed = frameCount(canvasElement);
    await expect(Number(changed)).toBeGreaterThan(Number(before));
    await delay(250);
    await expect(frameCount(canvasElement)).toBe(changed);
  },
};
export const Unavailable: Story = {
  args: { unavailable: true },
  play: async ({ canvasElement }) => {
    await waitFor(() =>
      expect(canvasElement.querySelector(".lifecycle-study")).toHaveAttribute(
        "data-renderer",
        "unavailable",
      ),
    );
    await expect(canvasElement.querySelector("canvas")).toBeNull();
  },
};
export const AssetUnavailable: Story = {
  args: { assetUrl: "./brand-exploration/unavailable.glb" },
  globals: { locale: "zh-CN" },
  play: async ({ canvas, canvasElement }) => {
    await waitFor(
      () =>
        expect(canvasElement.querySelector(".lifecycle-study")).toHaveAttribute(
          "data-renderer",
          "failed",
        ),
      { timeout: 15000 },
    );
    await expect(canvas.getByRole("status")).toHaveTextContent("场景资源暂时无法加载，请重试。");
    await expect(canvasElement.querySelector("canvas")).toBeNull();
    await userEvent.click(canvas.getByRole("button", { name: "重新加载" }));
    await waitFor(
      () =>
        expect(canvasElement.querySelector(".lifecycle-study")).toHaveAttribute(
          "data-renderer",
          "failed",
        ),
      { timeout: 15000 },
    );
    await expect(canvas.getByRole("button", { name: "重新加载" })).toBeEnabled();
  },
};
export const ColorAndThemeInteraction: Story = {
  globals: { locale: "zh-CN" },
  play: async ({ canvas, canvasElement }) => {
    const surface = canvasElement.querySelector(".lifecycle-study")!;
    await rendered(canvasElement);
    const sculpture = canvas.getByRole("button", { name: "生命周期分层图形，点击切换多彩模式" });
    await userEvent.click(sculpture);
    await expect(sculpture).toHaveAttribute("aria-pressed", "true");
    await userEvent.click(canvas.getByRole("button", { name: "暗色模式" }));
    await expect(surface).toHaveAttribute("data-theme", "light");
    await expect(surface).toHaveAttribute("data-color", "multi");
    sculpture.focus();
    await userEvent.keyboard("{Enter}");
    await expect(sculpture).toHaveAttribute("aria-pressed", "false");
    await userEvent.keyboard(" ");
    await expect(sculpture).toHaveAttribute("aria-pressed", "true");
    await userEvent.click(canvas.getByRole("button", { name: "暂停动效" }));
    await expect(surface).toHaveAttribute("data-motion", "paused");
    await delay(1400);
    const pausedFrame = frameCount(canvasElement);
    await delay(250);
    await expect(frameCount(canvasElement)).toBe(pausedFrame);
    await userEvent.click(canvas.getByRole("button", { name: "重置" }));
    await expect(surface).toHaveAttribute("data-motion", "running");
    await expect(surface).toHaveAttribute("data-color", "purple");
    await delay(100);
    await expect(Number(frameCount(canvasElement))).toBeGreaterThan(Number(pausedFrame));
  },
};

export const ReferenceDark: Story = {
  render: (args, { globals, loaded }) => (
    <ModelTemplateProvider template={loaded.modelTemplate}>
      <ReferenceComparison {...args} locale={storyLocale(globals)} />
    </ModelTemplateProvider>
  ),
};
export const ReferenceLight: Story = {
  args: { initialTheme: "light" },
  render: (args, { globals, loaded }) => (
    <ModelTemplateProvider template={loaded.modelTemplate}>
      <ReferenceComparison {...args} locale={storyLocale(globals)} />
    </ModelTemplateProvider>
  ),
};

// Each part uses the same renderer, material rig and geometry as the assembly.
export const GlassPlate: Story = { args: { part: "plate" } };
export const NodeNetwork: Story = { args: { part: "network" } };
export const EnergyModels: Story = { args: { part: "energy" } };
export const FactoryModels: Story = { args: { part: "factory" } };
export const ProductModel: Story = { args: { part: "product" } };
export const WorldMap: Story = { args: { part: "map" } };
