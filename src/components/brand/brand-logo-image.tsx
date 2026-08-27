"use client";

/* oxlint-disable next/no-img-element -- Deployment-configured SVG logos stay external, preserve intrinsic dimensions, and use a reviewed fallback chain. */

import { useState } from "react";

type BrandLogoImageProps = {
  alt: string;
  lightLogo: string;
  logoMark?: string;
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
  logoMark,
  darkLogo,
  width,
  height,
  priority,
}: BrandLogoImageProps) {
  const [fallbackLevel, setFallbackLevel] = useState(0);
  const configuredMark = logoMark ?? lightLogo;
  const configuredUsesDefaults =
    lightLogo === defaultLightLogo &&
    darkLogo === defaultDarkLogo &&
    configuredMark === defaultLightLogo;

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
      <span className="absolute inset-0 inline-flex">
        <img
          alt=""
          className="size-full object-contain sm:hidden"
          data-brand-logo-mark
          decoding="async"
          fetchPriority={priority ? "high" : "auto"}
          height={height}
          onError={() =>
            setFallbackLevel((level) => (level === 0 && configuredUsesDefaults ? 2 : level + 1))
          }
          src={usingDefaults ? defaultLightLogo : configuredMark}
          width={width}
        />
        <img
          alt=""
          className="hidden size-full object-contain sm:block dark:sm:hidden"
          data-brand-light-logo
          decoding="async"
          fetchPriority={priority ? "high" : "auto"}
          height={height}
          onError={() =>
            setFallbackLevel((level) => (level === 0 && configuredUsesDefaults ? 2 : level + 1))
          }
          src={usingDefaults ? defaultLightLogo : lightLogo}
          width={width}
        />
        <img
          alt=""
          className="hidden size-full object-contain dark:sm:block"
          data-brand-dark-logo
          decoding="async"
          fetchPriority={priority ? "high" : "auto"}
          height={height}
          onError={() =>
            setFallbackLevel((level) => (level === 0 && configuredUsesDefaults ? 2 : level + 1))
          }
          src={usingDefaults ? defaultDarkLogo : darkLogo}
          width={width}
        />
      </span>
    </span>
  );
}
