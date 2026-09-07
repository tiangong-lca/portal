import { readBrandConfig } from "../src/config/brand";

// Explicit defaults prevent deployment environment values entering the preview.
export const brandConfig = readBrandConfig({});
