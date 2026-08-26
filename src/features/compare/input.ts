import { isExactDatasetRef } from "@/features/catalog/exact-ref";

export function parseCompareIds(value: string | string[] | undefined): string[] {
  const values = (Array.isArray(value) ? value : [value]).flatMap(
    (entry) => entry?.split(",") ?? [],
  );
  return [...new Set(values.map((entry) => entry.trim()).filter(isExactDatasetRef))].slice(0, 4);
}

export function parseImpactCategoryId(value: string | string[] | undefined): string | null {
  const candidate = (Array.isArray(value) ? value[0] : value)?.trim();
  if (!candidate || candidate.length > 512) return null;
  const hasControlCharacter = Array.from(candidate).some((character) => {
    const codePoint = character.codePointAt(0) ?? 0;
    return codePoint <= 31 || (codePoint >= 127 && codePoint <= 159);
  });
  return hasControlCharacter ? null : candidate;
}
