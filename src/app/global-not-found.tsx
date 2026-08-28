import type { Metadata } from "next";

import { RootDocument } from "./root-document";

import "./globals.css";

export const metadata: Metadata = {
  description: "该公开页面不存在或当前不可见。",
  title: "页面不存在",
};

export default function GlobalNotFound() {
  return (
    <RootDocument lang="zh-CN">
      <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-3 px-6 py-12">
        <h1 className="font-heading text-3xl font-semibold">页面不存在</h1>
        <p className="text-muted-foreground">该公开页面不存在或当前不可见。</p>
      </main>
    </RootDocument>
  );
}
