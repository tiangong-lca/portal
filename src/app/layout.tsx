import type { Metadata } from "next";

/* oxlint-disable next/no-sync-scripts -- The same-origin theme bootstrap must run before first paint and contains no inline code. */

import { brandConfig } from "@/server/brand";

import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.SITE_URL ?? "http://localhost:3000"),
  title: {
    default: "天工 LCA 数据门户",
    template: "%s · 天工 LCA",
  },
  description: "匿名搜索、理解、比较和引用公开生命周期评价数据。",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: brandConfig.favicon,
  },
  openGraph: {
    description: "匿名搜索、理解、比较和引用公开生命周期评价数据。",
    images: [
      {
        alt: brandConfig.alt["zh-CN"],
        height: brandConfig.height,
        url: brandConfig.lightLogo,
        width: brandConfig.width,
      },
    ],
    siteName: "天工 LCA 数据门户",
    title: "天工 LCA 数据门户",
    type: "website",
  },
};

type RootLayoutProps = Readonly<{
  children: React.ReactNode;
}>;

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html data-brand-version={brandConfig.version} lang="zh-CN" suppressHydrationWarning>
      <head>
        <script src="/brand/theme-init.js" />
      </head>
      <body className="flex min-h-screen flex-col">{children}</body>
    </html>
  );
}
