import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { SearchIcon } from "lucide-react";
import { Badge } from "../../src/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "../../src/components/ui/alert";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from "../../src/components/ui/empty";
import { Button } from "../../src/components/ui/button";
import { dictionaries, storyLocale } from "../fixtures";

const meta = {
  component: Badge,
  subcomponents: {
    Button,
    Alert,
    AlertTitle,
    AlertDescription,
    Empty,
    EmptyHeader,
    EmptyMedia,
    EmptyTitle,
    EmptyDescription,
    EmptyContent,
  },
  title: "Primitives/Feedback",
} satisfies Meta;
export default meta;
type Story = StoryObj<Omit<typeof meta, "component">>;
export const Badges: Story = {
  render: (_, { globals }) => (
    <div className="flex flex-wrap gap-3">
      {(["default", "secondary", "outline", "destructive"] as const).map((variant) => (
        <Badge key={variant} variant={variant}>
          {dictionaries[storyLocale(globals)].Compare.statusInsufficient}
        </Badge>
      ))}
    </div>
  ),
};
export const Alerts: Story = {
  render: (_, { globals }) => {
    const m = dictionaries[storyLocale(globals)];
    return (
      <div className="grid gap-4">
        <Alert>
          <AlertTitle>{m.Collections.warningTitle}</AlertTitle>
          <AlertDescription>{m.Collections.warningDescription}</AlertDescription>
        </Alert>
        <Alert variant="destructive">
          <AlertTitle>{m.Search.unavailableTitle}</AlertTitle>
          <AlertDescription>{m.Search.unavailableDescription}</AlertDescription>
        </Alert>
      </div>
    );
  },
};
export const EmptyState: Story = {
  render: (_, { globals }) => {
    const m = dictionaries[storyLocale(globals)];
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <SearchIcon aria-hidden="true" />
          </EmptyMedia>
          <EmptyTitle>{m.Search.emptyTitle}</EmptyTitle>
          <EmptyDescription>{m.Search.emptyDescription}</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button variant="outline">{m.Search.clearFilters}</Button>
        </EmptyContent>
      </Empty>
    );
  },
};
export const DarkAlerts: Story = { ...Alerts, globals: { theme: "dark" } };
