export const PUBLIC_CATALOG_IMAGE_HOST = "cf.shopee.com.br";

const SUPPORTED_UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isSupportedUuid(value: unknown): value is string {
  return typeof value === "string" && SUPPORTED_UUID_PATTERN.test(value.trim());
}

export function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export function isNonNegativeFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

export function isValidCatalogDate(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0 && Number.isFinite(Date.parse(value));
}

export function isHttpsUrl(value: unknown): value is string {
  if (!isNonEmptyString(value)) return false;

  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.username === "" && url.password === "";
  } catch {
    return false;
  }
}

export function isPublicCatalogImageUrl(value: unknown): value is string {
  if (!isHttpsUrl(value)) return false;

  try {
    return new URL(value).hostname.toLowerCase() === PUBLIC_CATALOG_IMAGE_HOST;
  } catch {
    return false;
  }
}
