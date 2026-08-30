import { brandConfig } from "@/server/brand";
import type { PortalLocale } from "@/i18n/routing";

import { BrandLogoImage } from "./brand-logo-image";

type BrandLogoProps = {
  locale?: PortalLocale;
  priority?: boolean;
};

export function BrandLogo({ locale = "zh-CN", priority = false }: BrandLogoProps) {
  return (
    <BrandLogoImage
      alt={brandConfig.alt[locale]}
      darkLogo={brandConfig.darkLogo}
      height={brandConfig.height}
      lightLogo={brandConfig.lightLogo}
      logoMark={brandConfig.logoMark}
      priority={priority}
      width={brandConfig.width}
    />
  );
}
