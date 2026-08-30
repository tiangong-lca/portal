export const initiallyVisibleFacetValueLimit = 8;
export const disclosedFacetValueLimit = 8;
export const maximumRenderedFacetValuesPerGroup =
  initiallyVisibleFacetValueLimit + disclosedFacetValueLimit;

export function partitionFacetValues<T>(values: readonly T[]): {
  disclosed: T[];
  hiddenCount: number;
  visible: T[];
} {
  return {
    visible: values.slice(0, initiallyVisibleFacetValueLimit),
    disclosed: values.slice(initiallyVisibleFacetValueLimit, maximumRenderedFacetValuesPerGroup),
    hiddenCount: Math.max(0, values.length - maximumRenderedFacetValuesPerGroup),
  };
}
