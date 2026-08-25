import { SearchIcon } from "lucide-react";

import { BrandLogo } from "@/components/brand/brand-logo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Separator } from "@/components/ui/separator";

const supportedCapabilities = [
  "Process 与 Flow 公共目录",
  "精确版本、来源与引用信息",
  "公开 Exchanges 与 LCIA 结果",
] as const;

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-12 px-6 py-10 sm:px-10 lg:px-16 lg:py-16">
      <header className="flex flex-col gap-8">
        <div className="flex items-center gap-3">
          <BrandLogo priority />
          <div className="flex flex-col gap-1">
            <p className="font-medium">天工 LCA 数据门户</p>
            <p className="text-muted-foreground font-mono text-xs tracking-[0.14em] uppercase">
              Public evidence
            </p>
          </div>
          <Badge className="ml-auto" variant="outline">
            Phase 0
          </Badge>
        </div>

        <div className="flex max-w-3xl flex-col gap-4">
          <h1 className="font-heading text-4xl font-semibold tracking-tight text-balance sm:text-6xl">
            公开生命周期数据，从发现到引用。
          </h1>
          <p className="text-muted-foreground max-w-2xl text-lg leading-8">
            Portal
            正在建立匿名、只读、可验证的数据发现入口。所有展示能力以明确的公共契约和发布证据为准。
          </p>
        </div>

        <search className="max-w-2xl">
          <InputGroup className="h-11">
            <InputGroupAddon>
              <SearchIcon aria-hidden="true" />
            </InputGroupAddon>
            <InputGroupInput
              aria-label="搜索公开生命周期数据"
              disabled
              name="q"
              placeholder="公共目录契约接入后开放搜索"
              type="search"
            />
            <InputGroupAddon align="inline-end">
              <Button disabled size="sm" type="button">
                搜索
              </Button>
            </InputGroupAddon>
          </InputGroup>
        </search>
      </header>

      <Separator />

      <section aria-labelledby="bootstrap-capabilities" className="grid gap-4 sm:grid-cols-3">
        <h2 id="bootstrap-capabilities" className="sr-only">
          计划支持的公共能力
        </h2>
        {supportedCapabilities.map((capability, index) => (
          <Card className="min-h-40" key={capability} size="sm">
            <CardHeader>
              <Badge variant="secondary">0{index + 1}</Badge>
              <CardTitle>{capability}</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>仅在公共契约明确授权且证据完整时展示。</CardDescription>
            </CardContent>
          </Card>
        ))}
      </section>

      <footer className="text-muted-foreground text-sm">
        Phase 0 · Compatibility and governance bootstrap
      </footer>
    </main>
  );
}
