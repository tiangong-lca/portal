import { z } from "zod";

const hexColorSchema = z
  .string()
  .trim()
  .regex(/^#[0-9A-Fa-f]{6}$/, "Expected a color in #RRGGBB format")
  .transform((value) => value.toUpperCase());

const optionalHttpsOriginSchema = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value === "" ? undefined : value))
  .pipe(
    z
      .url()
      .refine((value) => {
        const url = new URL(value);

        return (
          url.protocol === "https:" &&
          url.username === "" &&
          url.password === "" &&
          url.pathname === "/" &&
          url.search === "" &&
          url.hash === ""
        );
      }, "Brand asset origin must be a credential-free HTTPS origin")
      .optional(),
  );

const rawBrandConfigSchema = z.object({
  lightPrimary: hexColorSchema.default("#5C246A"),
  darkPrimary: hexColorSchema.default("#9E3FFD"),
  version: z
    .string()
    .trim()
    .regex(/^[A-Za-z0-9._-]{1,64}$/)
    .default("default-v1"),
  lightLogo: z.string().trim().min(1).default("/brand/logo.svg"),
  darkLogo: z.string().trim().min(1).default("/brand/logo-dark.svg"),
  logoMark: z.string().trim().optional(),
  favicon: z.string().trim().min(1).default("/brand/favicon.ico"),
  altZh: z.string().trim().min(1).max(100).default("天工 LCA"),
  altEn: z.string().trim().min(1).max(100).default("TianGong LCA"),
  width: z.coerce.number().positive().max(4096).default(170.08),
  height: z.coerce.number().positive().max(4096).default(170.08),
  assetOrigin: optionalHttpsOriginSchema,
});

export type BrandConfig = {
  lightPrimary: string;
  darkPrimary: string;
  version: string;
  lightLogo: string;
  darkLogo: string;
  logoMark: string;
  favicon: string;
  alt: {
    "zh-CN": string;
    en: string;
  };
  width: number;
  height: number;
  assetOrigin?: string;
};

export type BrandEnvironment = Record<string, string | undefined> &
  Partial<
    Record<
      | "PORTAL_LIGHT_PRIMARY"
      | "PORTAL_DARK_PRIMARY"
      | "PORTAL_BRAND_VERSION"
      | "PORTAL_LIGHT_LOGO"
      | "PORTAL_DARK_LOGO"
      | "PORTAL_LOGO_MARK"
      | "PORTAL_FAVICON"
      | "PORTAL_LOGO_ALT_ZH"
      | "PORTAL_LOGO_ALT_EN"
      | "PORTAL_LOGO_WIDTH"
      | "PORTAL_LOGO_HEIGHT"
      | "PORTAL_BRAND_ASSET_ORIGIN",
      string | undefined
    >
  >;

function normalizeAssetReference(value: string, allowedOrigin?: string): string {
  if (value.startsWith("/brand/")) {
    const decodedPath = decodeURIComponent(value);

    if (
      decodedPath.includes("..") ||
      decodedPath.includes("\\") ||
      value.includes("?") ||
      value.includes("#")
    ) {
      throw new Error(`Invalid same-origin brand asset path: ${value}`);
    }

    return value;
  }

  const url = new URL(value);

  if (
    url.protocol !== "https:" ||
    url.username !== "" ||
    url.password !== "" ||
    url.search !== "" ||
    url.hash !== "" ||
    !allowedOrigin ||
    url.origin !== new URL(allowedOrigin).origin
  ) {
    throw new Error(`Remote brand asset is outside PORTAL_BRAND_ASSET_ORIGIN: ${value}`);
  }

  return url.toString();
}

export function readBrandConfig(environment: BrandEnvironment = process.env): BrandConfig {
  const raw = rawBrandConfigSchema.parse({
    lightPrimary: environment.PORTAL_LIGHT_PRIMARY,
    darkPrimary: environment.PORTAL_DARK_PRIMARY,
    version: environment.PORTAL_BRAND_VERSION,
    lightLogo: environment.PORTAL_LIGHT_LOGO,
    darkLogo: environment.PORTAL_DARK_LOGO,
    logoMark: environment.PORTAL_LOGO_MARK,
    favicon: environment.PORTAL_FAVICON,
    altZh: environment.PORTAL_LOGO_ALT_ZH,
    altEn: environment.PORTAL_LOGO_ALT_EN,
    width: environment.PORTAL_LOGO_WIDTH,
    height: environment.PORTAL_LOGO_HEIGHT,
    assetOrigin: environment.PORTAL_BRAND_ASSET_ORIGIN,
  });

  const lightLogo = normalizeAssetReference(raw.lightLogo, raw.assetOrigin);

  return {
    lightPrimary: raw.lightPrimary,
    darkPrimary: raw.darkPrimary,
    version: raw.version,
    lightLogo,
    darkLogo: normalizeAssetReference(raw.darkLogo, raw.assetOrigin),
    logoMark: raw.logoMark ? normalizeAssetReference(raw.logoMark, raw.assetOrigin) : lightLogo,
    favicon: normalizeAssetReference(raw.favicon, raw.assetOrigin),
    alt: {
      "zh-CN": raw.altZh,
      en: raw.altEn,
    },
    width: raw.width,
    height: raw.height,
    ...(raw.assetOrigin ? { assetOrigin: raw.assetOrigin } : {}),
  };
}

export function renderBrandCss(config: BrandConfig): string {
  return `:root {\n  --brand-light-primary: ${config.lightPrimary};\n  --brand-dark-primary: ${config.darkPrimary};\n}\n`;
}
