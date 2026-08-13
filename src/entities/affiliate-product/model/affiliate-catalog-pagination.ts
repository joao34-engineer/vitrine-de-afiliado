import type { DepartmentSlug, LeafSlug } from "@/shared/config/affiliate-taxonomy";

export const PUBLIC_AFFILIATE_CATALOG_PAGE_SIZE = 24;
export const PUBLIC_AFFILIATE_MAX_PROGRESSIVE_PAGES = 10;
const MAX_CURSOR_LENGTH = 512;

export type PublicAffiliateCatalogFilters = {
  readonly departmentSlug?: DepartmentSlug;
  readonly leafSlug?: LeafSlug;
};

export type PublicAffiliateCatalogPageRequest = PublicAffiliateCatalogFilters & {
  readonly cursor?: string;
  readonly pageSize?: number;
};

export type PublicAffiliateCatalogPage<T> = {
  readonly items: readonly T[];
  readonly nextCursor: string | null;
  readonly hasNextPage: boolean;
};

export type PublicAffiliateCatalogProgressivePage<T> = PublicAffiliateCatalogPage<T> & {
  readonly pageNumber: number;
  readonly startingCursor: string | null;
};

export type PublicAffiliateProductCursor = {
  readonly createdAt: string;
  readonly id: string;
};

function isUuid(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
  );
}

export function normalizePublicCatalogPageNumber(value: unknown): number {
  if (value === undefined) return 1;
  const parsed = typeof value === "string" && value.trim() !== "" ? Number(value) : value;
  if (typeof parsed !== "number" || !Number.isInteger(parsed) || parsed < 1 || parsed > PUBLIC_AFFILIATE_MAX_PROGRESSIVE_PAGES) {
    throw new Error(`Catalog page number must be between 1 and ${PUBLIC_AFFILIATE_MAX_PROGRESSIVE_PAGES}.`);
  }
  return parsed;
}

function isValidDate(value: unknown): value is string {
  return typeof value === "string" && Number.isFinite(Date.parse(value));
}

export function normalizePublicCatalogPageSize(value: unknown): number {
  if (value === undefined) {
    return PUBLIC_AFFILIATE_CATALOG_PAGE_SIZE;
  }

  if (typeof value !== "number" || !Number.isInteger(value)) {
    throw new Error("Catalog page size must be an integer.");
  }

  if (value < 1 || value > PUBLIC_AFFILIATE_CATALOG_PAGE_SIZE) {
    throw new Error(`Catalog page size must be between 1 and ${PUBLIC_AFFILIATE_CATALOG_PAGE_SIZE}.`);
  }

  return value;
}

export function encodePublicAffiliateProductCursor(
  cursor: PublicAffiliateProductCursor,
): string {
  if (!isValidDate(cursor.createdAt) || !isUuid(cursor.id)) {
    throw new Error("Cannot encode an invalid public catalog cursor.");
  }

  return Buffer.from(JSON.stringify(cursor), "utf8").toString("base64url");
}

export function decodePublicAffiliateProductCursor(
  value: unknown,
): PublicAffiliateProductCursor | null {
  if (typeof value !== "string" || value.length === 0 || value.length > MAX_CURSOR_LENGTH) {
    return null;
  }

  try {
    const decoded = JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as unknown;
    if (typeof decoded !== "object" || decoded === null) {
      return null;
    }

    const candidate = decoded as Record<string, unknown>;
    if (!isValidDate(candidate.createdAt) || !isUuid(candidate.id)) {
      return null;
    }

    return {
      createdAt: new Date(candidate.createdAt).toISOString(),
      id: candidate.id,
    };
  } catch {
    return null;
  }
}
