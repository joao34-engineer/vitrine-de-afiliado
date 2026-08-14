import type { DepartmentSlug, LeafSlug } from "@/shared/config/affiliate-taxonomy";

import { isSupportedUuid } from "./public-product-validation";

export const PUBLIC_AFFILIATE_SEARCH_MIN_LENGTH = 2;
export const PUBLIC_AFFILIATE_SEARCH_MAX_LENGTH = 120;

export type PublicAffiliateProductSearchRequest = {
  readonly query: string;
  readonly departmentSlug?: DepartmentSlug;
  readonly leafSlug?: LeafSlug;
  readonly cursor?: string;
  readonly pageSize?: number;
};

export type PublicAffiliateSearchCursor = {
  readonly rank: number;
  readonly createdAt: string;
  readonly id: string;
};

export function normalizePublicAffiliateSearchQuery(value: unknown): string {
  if (typeof value !== "string") {
    throw new Error("Search query must be a string.");
  }

  const query = value.trim().replace(/\s+/g, " ");
  if (
    query.length < PUBLIC_AFFILIATE_SEARCH_MIN_LENGTH ||
    query.length > PUBLIC_AFFILIATE_SEARCH_MAX_LENGTH
  ) {
    throw new Error(
      `Search query must contain between ${PUBLIC_AFFILIATE_SEARCH_MIN_LENGTH} and ${PUBLIC_AFFILIATE_SEARCH_MAX_LENGTH} characters.`,
    );
  }

  return query;
}

export function encodePublicAffiliateSearchCursor(
  cursor: PublicAffiliateSearchCursor,
): string {
  if (
    !Number.isFinite(cursor.rank) ||
    cursor.rank < 0 ||
    typeof cursor.createdAt !== "string" ||
    !Number.isFinite(Date.parse(cursor.createdAt)) ||
    !isSupportedUuid(cursor.id)
  ) {
    throw new Error("Cannot encode an invalid public search cursor.");
  }

  return Buffer.from(JSON.stringify(cursor), "utf8").toString("base64url");
}

export function decodePublicAffiliateSearchCursor(
  value: unknown,
): PublicAffiliateSearchCursor | null {
  if (typeof value !== "string" || value.length === 0 || value.length > 768) {
    return null;
  }

  try {
    const decoded = JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as unknown;
    if (typeof decoded !== "object" || decoded === null) {
      return null;
    }

    const candidate = decoded as Record<string, unknown>;
    if (
      typeof candidate.rank !== "number" ||
      !Number.isFinite(candidate.rank) ||
      candidate.rank < 0 ||
      typeof candidate.createdAt !== "string" ||
      !Number.isFinite(Date.parse(candidate.createdAt)) ||
      !isSupportedUuid(candidate.id)
    ) {
      return null;
    }

    return {
      rank: candidate.rank,
      createdAt: new Date(candidate.createdAt).toISOString(),
      id: candidate.id,
    };
  } catch {
    return null;
  }
}
