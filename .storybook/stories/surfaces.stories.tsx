import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "../../src/components/ui/card";
import { Separator } from "../../src/components/ui/separator";
import {
  Table,
  TableCaption,
  TableHeader,
  TableHead,
  TableBody,
  TableCell,
  TableRow,
} from "../../src/components/ui/table";
import { Button } from "../../src/components/ui/button";
import { dictionaries, storyLocale, sampleNames } from "../fixtures";

const meta = {
  component: Card,
  subcomponents: {
    Button,
    CardHeader,
    CardTitle,
    CardDescription,
    CardContent,
    CardFooter,
    Table,
    TableCaption,
    TableHeader,
    TableHead,
    TableBody,
    TableCell,
    TableRow,
    Separator,
  },
  title: "Primitives/Surfaces",
} satisfies Meta;
export default meta;
type Story = StoryObj<Omit<typeof meta, "component">>;
export const CardAndTable: Story = {
  render: (_, { globals }) => {
    const locale = storyLocale(globals);
    const m = dictionaries[locale];
    return (
      <Card>
        <CardHeader>
          <CardTitle>{m.Detail.lciaTitle}</CardTitle>
          <CardDescription>{m.Detail.lciaDescription}</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableCaption>{m.Compare.numericTitle}</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead scope="col">{m.Compare.dataset}</TableHead>
                <TableHead scope="col">{m.Detail.value}</TableHead>
                <TableHead scope="col">{m.Detail.unit}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sampleNames[locale].slice(0, 2).map((name, index) => (
                <TableRow key={name}>
                  <TableHead scope="row">{name}</TableHead>
                  <TableCell>{index === 0 ? "0.005" : "123456.789"}</TableCell>
                  <TableCell>kg CO₂ eq</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Separator className="my-4" />
          <p className="text-muted-foreground text-sm">Storybook fixture</p>
        </CardContent>
        <CardFooter>
          <Button>{m.Common.details}</Button>
        </CardFooter>
      </Card>
    );
  },
};
export const Dark: Story = { ...CardAndTable, globals: { theme: "dark" } };
