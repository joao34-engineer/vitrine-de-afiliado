import "server-only";

import { cacheLife, cacheTag } from "next/cache";
import { createPublicSupabaseClient } from "@/shared/api/supabase";
import {
  isDepartmentLeafPair,
  isDepartmentSlug,
  isLeafSlug,
  type DepartmentSlug,
  type LeafSlug,
} from "@/shared/config/affiliate-taxonomy";

import {
  decodePublicAffiliateProductCursor,
  encodePublicAffiliateProductCursor,
  normalizePublicCatalogPageSize,
  type PublicAffiliateProductCursor,
  type PublicAffiliateCatalogPage,
} from "../model/affiliate-catalog-pagination";
import { mapSupabasePublicProductRowToCard } from "../model/affiliate-product-mapper";
import { isSupabasePublicProductRow } from "../model/public-affiliate-product-row";
import type { PublicAffiliateProductCardData } from "../model/affiliate-product";
import type { SupabasePublicProductRow } from "@/types/supabase";
import { PublicAffiliateProductCatalogError } from "../model/public-affiliate-product-catalog-error";
import { isSupportedUuid } from "../model/public-product-validation";
import {
  PUBLIC_AFFILIATE_CATALOG_PAGE_SIZE,
  PUBLIC_AFFILIATE_CATALOG_MAX_REFILL_ATTEMPTS,
  PUBLIC_AFFILIATE_CATALOG_MAX_WINDOW_SIZE,
  PUBLIC_AFFILIATE_CATALOG_MAX_QUERY_LIMIT,
  normalizePublicCatalogPageNumber,
  type PublicAffiliateCatalogProgressivePage,
} from "../model/affiliate-catalog-pagination";

export type PublicAffiliateProductPageFilters = {
  readonly departmentSlug?: DepartmentSlug;
  readonly leafSlug?: LeafSlug;
  readonly cursor?: string;
  readonly pageSize?: number;
};

function validateFilters(filters: PublicAffiliateProductPageFilters): number {
  if (filters.departmentSlug !== undefined && !isDepartmentSlug(filters.departmentSlug)) {
    throw new PublicAffiliateProductCatalogError(
      "invalid-filter",
      "Invalid affiliate department filter.",
    );
  }

  if (filters.leafSlug !== undefined && !isLeafSlug(filters.leafSlug)) {
    throw new PublicAffiliateProductCatalogError(
      "invalid-filter",
      "Invalid affiliate leaf filter.",
    );
  }

  if (
    filters.departmentSlug !== undefined &&
    filters.leafSlug !== undefined &&
    !isDepartmentLeafPair(filters.departmentSlug, filters.leafSlug)
  ) {
    throw new PublicAffiliateProductCatalogError(
      "invalid-filter",
      "Affiliate department and leaf filters do not match.",
    );
  }

  if (filters.cursor !== undefined && decodePublicAffiliateProductCursor(filters.cursor) === null) {
    throw new PublicAffiliateProductCatalogError(
      "invalid-filter",
      "Invalid public catalog cursor.",
    );
  }

  try {
    return normalizePublicCatalogPageSize(filters.pageSize);
  } catch (error) {
    throw new PublicAffiliateProductCatalogError(
      "invalid-filter",
      error instanceof Error ? error.message : "Invalid catalog page size.",
      { cause: error },
    );
  }
}

function asUnknownArray(value: unknown): readonly unknown[] | null {
  return Array.isArray(value) ? value : null;
}

function getCursorableRow(value: unknown): PublicAffiliateProductCursor | null {
  if (typeof value !== "object" || value === null) return null;
  const row = value as Record<string, unknown>;
  if (
    !isSupportedUuid(row.id) ||
    typeof row.created_at !== "string" ||
    !Number.isFinite(Date.parse(row.created_at))
  ) {
    return null;
  }

  try {
    return {
      createdAt: new Date(row.created_at).toISOString(),
      id: row.id,
    };
  } catch {
    return null;
  }
}

function getCursor(filters: PublicAffiliateProductPageFilters) {
  return filters.cursor === undefined
    ? null
    : decodePublicAffiliateProductCursor(filters.cursor);
}

export async function listPublicAffiliateProductPage(
  filters: PublicAffiliateProductPageFilters = {},
): Promise<PublicAffiliateCatalogPage<PublicAffiliateProductCardData>> {
  const pageSize = validateFilters(filters);
  const cursor = getCursor(filters);
  return listPublicAffiliateProductPageCached({ ...filters, pageSize, cursor });
}

async function listPublicAffiliateProductPageCached(
  filters: Omit<PublicAffiliateProductPageFilters, "cursor" | "pageSize"> & {
    readonly pageSize: number;
    readonly cursor: ReturnType<typeof decodePublicAffiliateProductCursor>;
  },
): Promise<PublicAffiliateCatalogPage<PublicAffiliateProductCardData>> {
  "use cache";
  cacheLife("affiliateCatalog");
  cacheTag("affiliate-catalog");
  cacheTag(
    filters.departmentSlug === undefined
      ? "affiliate-catalog:department:all"
      : `affiliate-catalog:department:${filters.departmentSlug}`,
  );
  cacheTag(
    filters.leafSlug === undefined
      ? "affiliate-catalog:leaf:all"
      : `affiliate-catalog:leaf:${filters.leafSlug}`,
  );

  const client = createPublicSupabaseClient();
  const validRows: SupabasePublicProductRow[] = [];
  let cursor = filters.cursor;
  let sawRows = false;
  let exhausted = false;
  let attempts = 0;

  while (
    validRows.length < filters.pageSize + 1 &&
    !exhausted &&
    attempts < PUBLIC_AFFILIATE_CATALOG_MAX_REFILL_ATTEMPTS
  ) {
    const requestedLimit = Math.min(
      filters.pageSize + 1 - validRows.length,
      PUBLIC_AFFILIATE_CATALOG_MAX_QUERY_LIMIT,
    );
    const { data, error } = await client.rpc("list_public_affiliate_products", {
      p_department_slug: filters.departmentSlug ?? null,
      p_leaf_slug: filters.leafSlug ?? null,
      p_limit: requestedLimit,
      p_cursor_created_at: cursor?.createdAt ?? null,
      p_cursor_id: cursor?.id ?? null,
    });
    attempts += 1;

    if (error) {
      throw new PublicAffiliateProductCatalogError(
        "query-failed",
        "Failed to load public affiliate products.",
        { cause: error },
      );
    }

    const rows = asUnknownArray(data);
    if (rows === null) {
      throw new PublicAffiliateProductCatalogError(
        "invalid-response",
        "Supabase returned an invalid public product response.",
      );
    }
    sawRows ||= rows.length > 0;

    for (const row of rows) {
      if (isSupabasePublicProductRow(row) && mapSupabasePublicProductRowToCard(row) !== null) {
        validRows.push(row);
      }
    }

    const lastRawCursor = rows.length === 0 ? null : getCursorableRow(rows[rows.length - 1]);
    if (rows.length < requestedLimit) {
      exhausted = true;
    } else if (lastRawCursor === null) {
      throw new PublicAffiliateProductCatalogError(
        "invalid-response",
        "Supabase returned a row without a valid pagination cursor.",
      );
    } else {
      cursor = lastRawCursor;
    }
  }

  if (
    validRows.length < filters.pageSize + 1 &&
    !exhausted &&
    attempts >= PUBLIC_AFFILIATE_CATALOG_MAX_REFILL_ATTEMPTS
  ) {
    throw new PublicAffiliateProductCatalogError(
      "invalid-response",
      "Public catalog returned too many invalid rows to build a reliable page.",
    );
  }

  const hasNextPage = validRows.length > filters.pageSize;
  const items = validRows
    .slice(0, filters.pageSize)
    .map(mapSupabasePublicProductRowToCard)
    .filter((product): product is PublicAffiliateProductCardData => product !== null);

  if (sawRows && items.length === 0) {
    throw new PublicAffiliateProductCatalogError(
      "invalid-response",
      "Supabase returned no valid public affiliate products.",
    );
  }

  const lastRow = validRows[filters.pageSize - 1];
  const nextCursor = hasNextPage && lastRow !== undefined && lastRow.created_at !== null
    ? encodePublicAffiliateProductCursor({ createdAt: lastRow.created_at, id: lastRow.id })
    : null;

  return {
    items,
    hasNextPage: nextCursor !== null,
    nextCursor,
  };
}

export type PublicAffiliateProductProgressiveFilters = Omit<PublicAffiliateProductPageFilters, "cursor" | "pageSize"> & {
  readonly pageNumber?: unknown;
  readonly startingCursor?: string;
};

export async function listPublicAffiliateProductWindow(
  filters: PublicAffiliateProductProgressiveFilters = {},
): Promise<PublicAffiliateCatalogProgressivePage<PublicAffiliateProductCardData>> {
  let pageNumber: number;
  try {
    pageNumber = normalizePublicCatalogPageNumber(filters.pageNumber);
  } catch (error) {
    throw new PublicAffiliateProductCatalogError(
      "invalid-filter",
      error instanceof Error ? error.message : "Invalid catalog page number.",
      { cause: error },
    );
  }

  const startingCursor = filters.startingCursor ?? null;
  const cursor = startingCursor === null
    ? null
    : decodePublicAffiliateProductCursor(startingCursor);
  if (startingCursor !== null && cursor === null) {
    throw new PublicAffiliateProductCatalogError("invalid-filter", "Invalid catalog starting cursor.");
  }

  const pageSize = Math.min(
    pageNumber * PUBLIC_AFFILIATE_CATALOG_PAGE_SIZE,
    PUBLIC_AFFILIATE_CATALOG_MAX_WINDOW_SIZE,
  );
  validateFilters({
    departmentSlug: filters.departmentSlug,
    leafSlug: filters.leafSlug,
    cursor: startingCursor ?? undefined,
    pageSize: PUBLIC_AFFILIATE_CATALOG_PAGE_SIZE,
  });
  const page = await listPublicAffiliateProductPageCached({
    departmentSlug: filters.departmentSlug,
    leafSlug: filters.leafSlug,
    pageSize,
    cursor,
  });

  return {
    items: page.items,
    nextCursor: page.nextCursor,
    hasNextPage: page.hasNextPage,
    pageNumber,
    startingCursor,
  };
}
