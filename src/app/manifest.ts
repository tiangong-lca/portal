import type { MetadataRoute } from "next";

import { brandConfig } from "@/server/brand";

export default function manifest(): MetadataRoute.Manifest {
  return {
    background_color: "#ffffff",
    description: "Anonymous public discovery for lifecycle assessment data.",
    display: "standalone",
    icons: [
      {
        purpose: "any",
        sizes: "any",
        src: brandConfig.favicon,
      },
      {
        purpose: "any",
        sizes: `${Math.round(brandConfig.width)}x${Math.round(brandConfig.height)}`,
        src: brandConfig.lightLogo,
      },
    ],
    name: "TianGong LCA Data Portal",
    short_name: "TianGong LCA",
    start_url: "/",
    theme_color: brandConfig.lightPrimary,
  };
}
