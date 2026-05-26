const FALLBACK_TIMEZONE = "UTC";

/** Returns true for valid IANA timezone identifiers. */
export function isValidTimezone(value: string): boolean {
  const tz = value.trim();
  if (!tz) return false;

  try {
    Intl.DateTimeFormat("en-US", { timeZone: tz }).format(new Date());
    return true;
  } catch {
    return false;
  }
}

/**
 * Resolve a user-provided timezone to a valid IANA id.
 * Invalid values fall back to `fallback` or UTC.
 */
export function resolveTimezone(
  raw?: string | null,
  fallback = FALLBACK_TIMEZONE
): string {
  const candidate = raw?.trim();
  if (candidate && isValidTimezone(candidate)) return candidate;

  const fb = fallback.trim();
  if (fb && isValidTimezone(fb)) return fb;

  return FALLBACK_TIMEZONE;
}

/** Sanitize stored settings — invalid DB values become null. */
export function sanitizeStoredTimezone(raw?: string | null): string | null {
  const candidate = raw?.trim();
  if (!candidate) return null;
  return isValidTimezone(candidate) ? candidate : null;
}
