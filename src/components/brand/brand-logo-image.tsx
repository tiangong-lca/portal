"use client";

import { useState } from "react";

type BrandLogoImageProps = {
  alt: string;
  lightLogo: string;
  darkLogo: string;
  width: number;
  height: number;
  priority: boolean;
};

const defaultLightLogo = "/brand/logo.svg";
const defaultDarkLogo = "/brand/logo-dark.svg";

export function BrandLogoImage({
  alt,
  lightLogo,
  darkLogo,
  width,
  height,
  priority,
}: BrandLogoImageProps) {
  const [fallbackLevel, setFallbackLevel] = useState(0);
  const configuredUsesDefaults = lightLogo === defaultLightLogo && darkLogo === defaultDarkLogo;

  if (fallbackLevel >= 2) {
    return (
      <span
        className="bg-primary font-heading text-primary-foreground inline-flex size-10 shrink-0 items-center justify-center rounded-lg text-xs font-semibold"
        data-brand-logo-fallback="text"
      >
        <span className="sr-only">{alt}</span>
        <span aria-hidden="true">TG</span>
      </span>
    );
  }

  const usingDefaults = fallbackLevel === 1;

  return (
    <span
      className="bg-primary font-heading text-primary-foreground relative inline-flex size-10 shrink-0 items-center justify-center rounded-lg text-xs font-semibold"
      data-brand-logo
    >
      <span className="sr-only">{alt}</span>
      <span aria-hidden="true" data-brand-logo-fallback-layer>
        TG
      </span>
      <picture className="absolute inset-0 inline-flex">
        <source
          media="(prefers-color-scheme: dark)"
          srcSet={usingDefaults ? defaultDarkLogo : darkLogo}
        />
        <img
          alt=""
          className="size-full object-contain"
          decoding="async"
          fetchPriority={priority ? "high" : "auto"}
          height={height}
          onError={() =>
            setFallbackLevel((level) => (level === 0 && configuredUsesDefaults ? 2 : level + 1))
          }
          src={usingDefaults ? defaultLightLogo : lightLogo}
          width={width}
        />
      </picture>
    </span>
  );
}
