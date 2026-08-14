import { isSupportedUuid, isValidCatalogDate } from "./public-product-validation";
import type { AffiliateReviewCursor } from "./affiliate-review";

function toBase64Url(value: string): string {
  return Buffer.from(value, "utf8").toString("base64url");
}

function fromBase64Url(value: string): string | null {
  try {
    return Buffer.from(value, "base64url").toString("utf8");
  } catch {
    return null;
  }
}

export function encodeAffiliateReviewCursor(cursor: AffiliateReviewCursor): string {
  return toBase64Url(JSON.stringify(cursor));
}

export function decodeAffiliateReviewCursor(value: unknown): AffiliateReviewCursor | null {
  if (typeof value !== "string" || value.length === 0 || value.length > 512) return null;
  const decoded = fromBase64Url(value);
  if (decoded === null) return null;

  try {
    const parsed: unknown = JSON.parse(decoded);
    if (typeof parsed !== "object" || parsed === null) return null;
    const record = parsed as Record<string, unknown>;
    if (!isValidCatalogDate(record.updatedAt) || !isSupportedUuid(record.id)) return null;
    return { updatedAt: record.updatedAt, id: record.id };
  } catch {
    return null;
  }
}
