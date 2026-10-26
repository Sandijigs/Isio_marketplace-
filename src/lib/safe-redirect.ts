/**
 * Only ever redirect to a path on this site after sign-in. Anything else
 * (absolute URLs, protocol-relative "//evil.example", backslash tricks) falls back.
 */
export function safeNextPath(value: unknown, fallback = '/'): string {
  if (typeof value !== 'string' || !value.startsWith('/')) return fallback;
  if (value.startsWith('//') || value.startsWith('/\\') || /[\u0000-\u001f]/.test(value)) return fallback;
  return value;
}
