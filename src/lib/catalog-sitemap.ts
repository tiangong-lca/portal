import "server-only";

import type { MetadataRoute } from "next";

import { localePath } from "@/i18n/routing";
import { listPublicSitemapEntries } from "@/server/data/catalog";
import { PortalDataError } from "@/server/data/supabase-rpc";

const maximumDatasetEntries = 49_000;

function siteUrl(path: string): string {
  return new URL(path, process.env.SITE_URL ?? "http://localhost:3000").toString();
}

export async function catalogSitemap(kind: "process" | "flow"): Promise<MetadataRoute.Sitemap> {
  if (!process.env.SUPABASE_URL && !process.env.SUPABASE_PUBLISHABLE_KEY) return [];

  const items: Awaited<ReturnType<typeof listPublicSitemapEntries>>["items"] = [];
  const seenCursors = new Set<string>();
  let cursor: string | null = null;
  try {
    do {
      const page = await listPublicSitemapEntries({ cursor, kind, limit: 1000 });
      items.push(...page.items.slice(0, maximumDatasetEntries - items.length));
      cursor = page.nextCursor;
      if (cursor && seenCursors.has(cursor)) break;
      if (cursor) seenCursors.add(cursor);
    } while (cursor && items.length < maximumDatasetEntries);
  } catch (error) {
    if (!(error instanceof PortalDataError)) throw error;
    return [];
  }

  return items.map((item) => {
    const path = `${item.key.kind}/${item.key.id}@${item.key.version}`;
    return {
      alternates: {
        languages: {
          en: siteUrl(localePath("en", path)),
          "zh-CN": siteUrl(localePath("zh-CN", path)),
        },
      },
      changeFrequency: "weekly" as const,
      lastModified: item.modifiedAt,
      priority: 0.8,
      url: siteUrl(localePath("zh-CN", path)),
    };
  });
}
