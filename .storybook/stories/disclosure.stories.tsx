import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, waitFor, within } from "storybook/test";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../../src/components/ui/accordion";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "../../src/components/ui/sheet";
import { Button } from "../../src/components/ui/button";
import { Toggle } from "../../src/components/ui/toggle";
import { ToggleGroup, ToggleGroupItem } from "../../src/components/ui/toggle-group";
import { dictionaries, storyLocale, mobileGlobals } from "../fixtures";

const meta = { title: "Primitives/Disclosure and selection" } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;
export const AccordionDisclosure: Story = {
  render: (_, { globals }) => {
    const m = dictionaries[storyLocale(globals)].Detail;
    return (
      <Accordion type="single" collapsible>
        <AccordionItem value="scope">
          <AccordionTrigger>{m.methodTitle}</AccordionTrigger>
          <AccordionContent>{m.methodEmpty}</AccordionContent>
        </AccordionItem>
        <AccordionItem value="quality">
          <AccordionTrigger>{m.qualityTitle}</AccordionTrigger>
          <AccordionContent>{m.qualityEmpty}</AccordionContent>
        </AccordionItem>
      </Accordion>
    );
  },
  play: async ({ canvas, userEvent, globals }) => {
    const label = dictionaries[storyLocale(globals)].Detail.methodTitle;
    const trigger = canvas.getByRole("button", { name: label });
    await userEvent.click(trigger);
    await expect(trigger).toHaveAttribute("aria-expanded", "true");
    await userEvent.keyboard("{Enter}");
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
  },
};
export const FilterSheet: Story = {
  render: (_, { globals }) => {
    const m = dictionaries[storyLocale(globals)];
    return (
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline">{m.Search.facets}</Button>
        </SheetTrigger>
        <SheetContent closeLabel={m.Common.close}>
          <SheetHeader>
            <SheetTitle>{m.Search.facets}</SheetTitle>
            <SheetDescription>{m.Search.filtersDescription}</SheetDescription>
          </SheetHeader>
        </SheetContent>
      </Sheet>
    );
  },
  play: async ({ canvas, canvasElement, userEvent, globals }) => {
    const m = dictionaries[storyLocale(globals)];
    const trigger = canvas.getByRole("button", { name: m.Search.facets });
    await userEvent.click(trigger);
    const body = within(canvasElement.ownerDocument.body);
    await waitFor(() => expect(body.getByRole("dialog", { name: m.Search.facets })).toBeVisible());
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(trigger).toHaveFocus());
  },
};
export const MobileSheet: Story = {
  ...FilterSheet,
  globals: mobileGlobals,
  play: async ({ canvas, canvasElement, userEvent, globals }) => {
    const m = dictionaries[storyLocale(globals)];
    await userEvent.click(canvas.getByRole("button", { name: m.Search.facets }));
    await waitFor(() =>
      expect(
        within(canvasElement.ownerDocument.body).getByRole("dialog", { name: m.Search.facets }),
      ).toBeVisible(),
    );
  },
};
export const Toggles: Story = {
  render: (_, { globals }) => {
    const m = dictionaries[storyLocale(globals)];
    return (
      <div className="flex flex-col gap-6">
        <Toggle aria-label={m.Collections.selected}>{m.Collections.selected}</Toggle>
        <ToggleGroup
          aria-label={m.Search.objectType}
          type="single"
          defaultValue="process"
          variant="outline"
        >
          <ToggleGroupItem value="process">{m.Common.process}</ToggleGroupItem>
          <ToggleGroupItem value="flow">{m.Common.flow}</ToggleGroupItem>
        </ToggleGroup>
      </div>
    );
  },
  play: async ({ canvas, userEvent, globals }) => {
    const m = dictionaries[storyLocale(globals)];
    const process = canvas.getByRole("radio", { name: m.Common.process });
    const flow = canvas.getByRole("radio", { name: m.Common.flow });
    await userEvent.hover(flow);
    await expect(process).toHaveAttribute("aria-checked", "true");
    await expect(flow).toHaveAttribute("aria-checked", "false");
    await expect(getComputedStyle(process).textDecorationLine).toContain("underline");
    await expect(getComputedStyle(flow).textDecorationLine).not.toContain("underline");
    await userEvent.click(flow);
    await expect(flow).toHaveAttribute("aria-checked", "true");
    await expect(process).toHaveAttribute("aria-checked", "false");
    const toggle = canvas.getByRole("button", { name: m.Collections.selected });
    await userEvent.click(toggle);
    await expect(toggle).toHaveAttribute("aria-pressed", "true");
    await userEvent.keyboard(" ");
    await expect(toggle).toHaveAttribute("aria-pressed", "false");
  },
};
export const DarkToggles: Story = { ...Toggles, globals: { theme: "dark" } };
