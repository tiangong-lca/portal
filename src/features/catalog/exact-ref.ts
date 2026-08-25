const datasetUuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const exactRefPattern = new RegExp(
  `^${datasetUuidPattern.source.slice(1, -1)}@\\d{2}\\.\\d{2}\\.\\d{3}$`,
);

export function isDatasetUuid(value: string): boolean {
  return datasetUuidPattern.test(value);
}

export function isExactDatasetRef(value: string): boolean {
  return value.length === 47 && exactRefPattern.test(value);
}

export function parseExactDatasetRef(value: string): { id: string; version: string } | null {
  if (!isExactDatasetRef(value)) return null;
  const separator = value.lastIndexOf("@");

  return {
    id: value.slice(0, separator),
    version: value.slice(separator + 1),
  };
}
