import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ArrowLeftIcon, ArrowRightIcon } from "lucide-react";
import { expect } from "storybook/test";

import { Button } from "../../src/components/ui/button";
import { CatalogPagination } from "../../src/features/catalog/catalog-pagination";
import { dictionaries, mobileGlobals, storyLocale } from "../fixtures";

const meta = {
  title: "Catalog/Pagination",
  component: CatalogPagination,
  subcomponents: { Button },
  tags: ["!autodocs"],
  args: { children: null, label: "Pagination" },
  argTypes: { children: { control: false }, label: { control: false } },
  render: (_, { globals, parameters }) => {
    const common = dictionaries[storyLocale(globals)].Common;
    const previousDisabled = Boolean(parameters.previousDisabled);
    const nextDisabled = Boolean(parameters.nextDisabled);
    return (
      <div className="catalog-search-modes max-w-4xl p-6">
        <CatalogPagination label={`${common.previous} / ${common.next}`}>
          <Button disabled={previousDisabled} variant="outline">
            <ArrowLeftIcon aria-hidden="true" />
            {common.previous}
          </Button>
          <Button disabled={nextDisabled} variant="outline">
            {common.next}
            <ArrowRightIcon aria-hidden="true" />
          </Button>
        </CatalogPagination>
      </div>
    );
  },
} satisfies Meta<typeof CatalogPagination>;

export default meta;
type Story = StoryObj<typeof meta>;

async function expectHorizontalPagination(
  canvas: Parameters<NonNullable<Story["play"]>>[0]["canvas"],
) {
  const navigation = canvas.getByRole("navigation");
  const [previous, next] = canvas.getAllByRole("button");
  const previousBounds = previous!.getBoundingClientRect();
  const nextBounds = next!.getBoundingClientRect();
  await expect(getComputedStyle(navigation).flexDirection).toBe("row");
  await expect(Math.abs(previousBounds.top - nextBounds.top)).toBeLessThan(2);
  await expect(previousBounds.left).toBeLessThan(nextBounds.left);
}

export const FirstPage: Story = {
  parameters: { previousDisabled: true },
  play: async ({ canvas, globals }) => {
    const common = dictionaries[storyLocale(globals)].Common;
    await expect(canvas.getByRole("button", { name: common.previous })).toBeDisabled();
    await expect(canvas.getByRole("button", { name: common.next })).toBeEnabled();
    await expectHorizontalPagination(canvas);
  },
};

export const MiddlePage: Story = {
  play: async ({ canvas }) => expectHorizontalPagination(canvas),
};

export const LastPageMobileDark: Story = {
  globals: { ...mobileGlobals, theme: "dark" },
  parameters: { nextDisabled: true },
  play: async ({ canvas, globals }) => {
    const common = dictionaries[storyLocale(globals)].Common;
    await expect(canvas.getByRole("button", { name: common.previous })).toBeEnabled();
    await expect(canvas.getByRole("button", { name: common.next })).toBeDisabled();
    await expectHorizontalPagination(canvas);
  },
};
