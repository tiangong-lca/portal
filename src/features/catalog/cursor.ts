export function safePublicCursor(value: string | string[] | undefined): string | null {
  const candidate = Array.isArray(value) ? value[0] : value;
  return candidate && /^[A-Za-z0-9_-]{1,4096}$/.test(candidate) ? candidate : null;
}
