type ContentSecurityPolicyInput = {
  allowFrameworkInline: boolean;
  brandAssetOrigin?: string;
  isDevelopment: boolean;
};

export function buildContentSecurityPolicy({
  allowFrameworkInline,
  brandAssetOrigin,
  isDevelopment,
}: ContentSecurityPolicyInput): string {
  const imageSources = [
    "'self'",
    "blob:",
    "data:",
    ...(brandAssetOrigin ? [brandAssetOrigin] : []),
  ];

  return [
    "default-src 'self'",
    `script-src 'self'${allowFrameworkInline || isDevelopment ? " 'unsafe-inline'" : ""}${isDevelopment ? " 'unsafe-eval'" : ""}`,
    `style-src 'self'${allowFrameworkInline || isDevelopment ? " 'unsafe-inline'" : ""}`,
    `img-src ${imageSources.join(" ")}`,
    "font-src 'self'",
    "connect-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    ...(isDevelopment ? [] : ["upgrade-insecure-requests"]),
  ].join("; ");
}

export function contentSecurityPolicyHeader(
  value: string,
  enforce: boolean,
): { key: "Content-Security-Policy" | "Content-Security-Policy-Report-Only"; value: string } {
  return {
    key: enforce ? "Content-Security-Policy" : "Content-Security-Policy-Report-Only",
    value,
  };
}
