import type { Metadata } from "next";

import { RootDocument, portalMetadata } from "../root-document";

import "../globals.css";

export const metadata: Metadata = portalMetadata;

export default function DefaultRootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <RootDocument lang="zh-CN">{children}</RootDocument>;
}
