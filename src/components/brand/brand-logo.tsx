import { brandConfig } from "@/server/brand";

import { BrandLogoImage } from "./brand-logo-image";

type BrandLogoProps = {
  locale?: "zh-CN" | "en";
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
