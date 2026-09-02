import type { CatalogResultViewModel, CatalogVersionMatch } from "./view-model";

// Keep upstream order and the representative's score. A version-rich dataset
// never gains a new score or displaces another dataset on the client.
export function groupSearchResults(items: CatalogResultViewModel[]): CatalogResultViewModel[] {
  const groups = new Map<string, CatalogResultViewModel>();
  for (const item of items) {
    const datasetKey = `${item.kind}:${item.ref.split("@", 1)[0]}`;
    const group = groups.get(datasetKey);
    if (!group) {
      groups.set(datasetKey, { ...item, matchingVersions: [...(item.matchingVersions ?? [])] });
      continue;
    }
    const matches: CatalogVersionMatch[] = [
      { ref: item.ref, version: item.ref.split("@")[1] ?? "", name: item.name, match: item.match },
      ...(item.matchingVersions ?? []),
    ];
    const known = new Set([
      group.ref,
      ...(group.matchingVersions ?? []).map((version) => version.ref),
    ]);
    for (const match of matches) {
      if (known.has(match.ref)) continue;
      group.matchingVersions!.push(match);
      known.add(match.ref);
    }
  }
  return [...groups.values()];
}
