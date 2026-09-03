import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import messages from "@/i18n/messages/en.json";
import fixture from "../fixtures/portal/catalog-v1.json";
import { publicDatasetEnvelopeSchema } from "@/server/contracts/portal";
import { mapDataset } from "@/features/catalog/map-public-data";

vi.mock("next-intl/server", () => ({
  getTranslations:
    async ({ namespace }: { namespace: string }) =>
    (key: string) => {
      const table = (messages as Record<string, Record<string, string>>)[namespace];
      if (!table?.[key]) throw new Error(`Missing test translation: ${namespace}.${key}`);
      return table[key];
    },
}));

import { OverviewPanel } from "@/features/catalog/overview-panel";
import { AvailabilityBadges } from "@/features/catalog/availability-badges";

afterEach(cleanup);

describe("dataset-aware public presentation", () => {
  it("shows Flow metadata without Process-only placeholders or a false open-data label", async () => {
    const record = mapDataset(
      publicDatasetEnvelopeSchema.parse(fixture.datasetFlow),
      "en",
      "https://portal.example/en/flow/example",
    );
    render(await OverviewPanel({ locale: "en", record }));
    expect(screen.getByText("124-38-9")).toBeVisible();
    expect(screen.getByText("Reference flow property")).toBeVisible();
    expect(screen.getByText("Mass")).toBeVisible();
    expect(screen.queryByText("Functional unit")).not.toBeInTheDocument();
    expect(screen.queryByText("Reference year")).not.toBeInTheDocument();
    expect(screen.queryByText("supply")).not.toBeInTheDocument();
    expect(screen.queryByText(messages.Common.public)).not.toBeInTheDocument();
    expect(screen.getByText(messages.Detail.availabilityHelp)).toBeVisible();
  });

  it("shows only the exact capabilities supplied with a dataset", () => {
    const labels = {
      exchanges: messages.Common.exchangesAvailable,
      lcia: messages.Common.lciaAvailable,
      metadata: messages.Common.metadataOnly,
    };
    const view = render(
      <div data-testid="availability">
        <AvailabilityBadges
          capabilities={{ exchangesVisible: false, lciaVisible: false }}
          labels={labels}
        />
      </div>,
    );
    expect(within(screen.getByTestId("availability")).getByText(labels.metadata)).toBeVisible();
    expect(screen.queryByText(labels.lcia)).not.toBeInTheDocument();
    view.rerender(
      <AvailabilityBadges
        capabilities={{ exchangesVisible: true, lciaVisible: false }}
        labels={labels}
      />,
    );
    expect(screen.getByText(labels.exchanges)).toBeVisible();
    expect(screen.queryByText(labels.metadata)).not.toBeInTheDocument();
    expect(screen.queryByText(labels.lcia)).not.toBeInTheDocument();
  });
});
