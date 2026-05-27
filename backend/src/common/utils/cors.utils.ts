export function parseCorsOrigins(values: Array<string | undefined>): string[] {
  const origins = values
    .filter(Boolean)
    .flatMap((value) => String(value).split(','))
    .map((origin) => normalizeOrigin(origin))
    .filter((origin): origin is string => Boolean(origin));

  return Array.from(new Set(origins));
}

export function isOriginAllowed(origin: string | undefined, allowedOrigins: string[]): boolean {
  if (!origin) return true;
  return allowedOrigins.includes(normalizeOrigin(origin) || origin);
}

export function createCorsOriginDelegate(allowedOrigins: string[]) {
  return (
    origin: string | undefined,
    callback: (error: Error | null, allow?: boolean) => void,
  ): void => {
    callback(null, isOriginAllowed(origin, allowedOrigins));
  };
}

function normalizeOrigin(value: string): string | undefined {
  const trimmed = value.trim().replace(/\/+$/, '');
  if (!trimmed || trimmed === '*') return undefined;

  try {
    return new URL(trimmed).origin;
  } catch {
    return trimmed;
  }
}
