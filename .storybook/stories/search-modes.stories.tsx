import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";
import { http, HttpResponse } from "msw";
import { SearchModes } from "../../src/features/catalog/search-modes";
import { HybridSearchPanel } from "../../src/features/catalog/hybrid-search-panel";
import { KeywordSearchForm } from "../../src/features/catalog/keyword-search-form";
import { Field, FieldLabel } from "../../src/components/ui/field";
import { Input } from "../../src/components/ui/input";
import { Button } from "../../src/components/ui/button";
import { dictionaries, mobileGlobals, resultLabels, storyLocale } from "../fixtures";

const meta = {
  title: "Catalog/Search modes",
  tags: ["!autodocs"],
  parameters: {
    msw: [
      http.post("*/internal/hybrid", () => HttpResponse.json({}, { status: 503 })),
      http.post("*/internal/hybrid/lexical", () => HttpResponse.json({}, { status: 503 })),
    ],
  },
  render: (_, { globals }) => {
    const locale = storyLocale(globals);
    const m = dictionaries[locale];
    return (
      <SearchModes
        labels={{
          mode: m.Search.searchMode,
          keyword: m.Search.keywordMode,
          description: m.Search.descriptionMode,
        }}
        keyword={
          <KeywordSearchForm action={`/${locale}/search`}>
            <Field>
              <FieldLabel htmlFor="storybook-keyword">{m.Search.label}</FieldLabel>
              <Input id="storybook-keyword" name="q" placeholder={m.Search.placeholder} />
            </Field>
            <Button className="self-start" type="submit">
              {m.Search.submit}
            </Button>
          </KeywordSearchForm>
        }
        description={
          <HybridSearchPanel
            initialKind="process"
            initialFilters={{}}
            labels={m.Hybrid}
            locale={locale}
            resultLabels={resultLabels(locale)}
            siteOrigin="https://portal.example"
          />
        }
      />
    );
  },
} satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;
export const Keyword: Story = {};
export const Description: Story = {
  play: async ({ canvas, userEvent, globals }) => {
    const m = dictionaries[storyLocale(globals)];
    await userEvent.click(canvas.getByRole("radio", { name: m.Search.descriptionMode }));
    await expect(canvas.getByRole("textbox", { name: m.Hybrid.queryLabel })).toBeVisible();
    await expect(canvas.queryByRole("textbox", { name: m.Search.label })).not.toBeInTheDocument();
  },
};
export const MobileFrench: Story = { ...Description, globals: { ...mobileGlobals, locale: "fr" } };
