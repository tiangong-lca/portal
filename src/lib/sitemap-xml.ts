import "server-only";

import type { MetadataRoute } from "next";

function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

export function renderSitemapIndex(urls: string[]): string {
  const entries = urls.map((url) => `<sitemap><loc>${escapeXml(url)}</loc></sitemap>`).join("");
  return `<?xml version="1.0" encoding="UTF-8"?><sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${entries}</sitemapindex>`;
}

export function renderSitemapUrlSet(entries: MetadataRoute.Sitemap): string {
  const urls = entries
    .map((entry) => {
      const alternates = Object.entries(entry.alternates?.languages ?? {})
        .flatMap(([language, url]) =>
          typeof url === "string"
            ? [
                `<xhtml:link rel="alternate" hreflang="${escapeXml(language)}" href="${escapeXml(url)}"/>`,
              ]
            : [],
        )
        .join("");
      const lastModified = entry.lastModified
        ? `<lastmod>${escapeXml(
            entry.lastModified instanceof Date
              ? entry.lastModified.toISOString()
              : entry.lastModified.toString(),
          )}</lastmod>`
        : "";
      const changeFrequency = entry.changeFrequency
        ? `<changefreq>${entry.changeFrequency}</changefreq>`
        : "";
      const priority = entry.priority === undefined ? "" : `<priority>${entry.priority}</priority>`;
      return `<url><loc>${escapeXml(entry.url)}</loc>${lastModified}${changeFrequency}${priority}${alternates}</url>`;
    })
    .join("");
  return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">${urls}</urlset>`;
}
