import { formatHex, interpolate, wcagContrast } from "culori";

export const brandScaleSteps = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950] as const;

export type BrandScaleStep = (typeof brandScaleSteps)[number];
export type BrandScale = Record<BrandScaleStep, string>;

export type BrandThemePalette = {
  active: string;
  foreground: string;
  hover: string;
  link: string;
  primary: string;
  ring: string;
  scale: BrandScale;
  subtle: string;
};

const white = "#FFFFFF";
const black = "#000000";
const lightBackground = "#FFFFFF";
const darkBackground = "#18181B";

function mixHex(from: string, to: string, amount: number): string {
  const value = formatHex(interpolate([from, to], "oklch")(amount));
  if (!value) throw new Error("Unable to derive an OKLCH brand color");
  return value.toUpperCase();
}

export function createBrandScale(seed: string): BrandScale {
  return {
    50: mixHex(white, seed, 0.08),
    100: mixHex(white, seed, 0.16),
    200: mixHex(white, seed, 0.3),
    300: mixHex(white, seed, 0.46),
    400: mixHex(white, seed, 0.68),
    500: seed.toUpperCase(),
    600: mixHex(seed, black, 0.12),
    700: mixHex(seed, black, 0.28),
    800: mixHex(seed, black, 0.45),
    900: mixHex(seed, black, 0.62),
    950: mixHex(seed, black, 0.76),
  };
}

function accessibleColor(
  candidates: string[],
  background: string,
  minimumContrast: number,
  label: string,
): string {
  const color = candidates.find(
    (candidate) => wcagContrast(candidate, background) >= minimumContrast,
  );
  if (!color) throw new Error(`Brand ${label} cannot meet the required contrast ratio`);
  return color;
}

function primaryForeground(primary: string): string {
  if (wcagContrast(primary, white) >= 4.5) return white;
  if (wcagContrast(primary, black) >= 4.5) return black;
  throw new Error("Brand primary cannot meet WCAG AA with a solid foreground");
}

export function createBrandThemePalette(seed: string, theme: "light" | "dark"): BrandThemePalette {
  const scale = createBrandScale(seed);
  const background = theme === "light" ? lightBackground : darkBackground;
  const foreground = primaryForeground(scale[500]);
  const linkCandidates =
    theme === "light"
      ? [scale[500], scale[600], scale[700], scale[800], scale[900]]
      : [scale[500], scale[400], scale[300], scale[200], scale[100], scale[50]];
  const stateCandidates = [scale[600], scale[700], scale[800], scale[400], scale[300]];
  const hover = accessibleColor(stateCandidates, foreground, 4.5, `${theme} hover`);
  const active = accessibleColor(
    stateCandidates.filter((candidate) => candidate !== hover),
    foreground,
    4.5,
    `${theme} active`,
  );
  const link = accessibleColor(linkCandidates, background, 4.5, `${theme} link`);
  const ring = accessibleColor(linkCandidates, background, 3, `${theme} focus ring`);

  return {
    active,
    foreground,
    hover,
    link,
    primary: scale[500],
    ring,
    scale,
    subtle: theme === "light" ? scale[50] : scale[900],
  };
}

export function assertBrandPaletteContrast(palette: BrandThemePalette, theme: "light" | "dark") {
  const background = theme === "light" ? lightBackground : darkBackground;
  const checks = [
    ["primary", palette.primary, palette.foreground, 4.5],
    ["hover", palette.hover, palette.foreground, 4.5],
    ["active", palette.active, palette.foreground, 4.5],
    ["link", palette.link, background, 4.5],
    ["ring", palette.ring, background, 3],
  ] as const;

  for (const [label, foreground, backgroundColor, minimum] of checks) {
    if (wcagContrast(foreground, backgroundColor) < minimum) {
      throw new Error(`Brand ${theme} ${label} contrast is below ${minimum}:1`);
    }
  }
}
