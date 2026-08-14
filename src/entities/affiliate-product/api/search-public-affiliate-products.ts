import "server-only";

import { cacheLife, cacheTag } from "next/cache";
import { createPublicSupabaseClient } from "@/shared/api/supabase";
import {
  isDepartmentLeafPair,
  isDepartmentSlug,
  isLeafSlug,
} from "@/shared/config/affiliate-taxonomy";
import type { SupabaseSearchProductRow } from "@/types/supabase";

import {
  decodePublicAffiliateSearchCursor,
  encodePublicAffiliateSearchCursor,
  normalizePublicAffiliateSearchQuery,
  type PublicAffiliateSearchCursor,
  type PublicAffiliateProductSearchRequest,
} from "../model/affiliate-search";
import type { PublicAffiliateProductCardData } from "../model/affiliate-product";
import { mapSupabasePublicProductRowToCard } from "../model/affiliate-product-mapper";
import { isSupabasePublicProductRow } from "../model/public-affiliate-product-row";
import { PublicAffiliateProductCatalogError } from "../model/public-affiliate-product-catalog-error";
import { isSupportedUuid } from "../model/public-product-validation";
import {
  PUBLIC_AFFILIATE_CATALOG_PAGE_SIZE,
  PUBLIC_AFFILIATE_CATALOG_MAX_QUERY_LIMIT,
  PUBLIC_AFFILIATE_CATALOG_MAX_REFILL_ATTEMPTS,
  normalizePublicCatalogPageNumber,
  normalizePublicCatalogPageSize,
  type PublicAffiliateCatalogPage,
  type PublicAffiliateCatalogProgressivePage,
} from "../model/affiliate-catalog-pagination";

export type PublicAffiliateProductSearchFilters = PublicAffiliateProductSearchRequest;

function validateSearchFilters(filters: PublicAffiliateProductSearchFilters): {
  readonly query: string;
  readonly pageSize: number;
} {
  let query: string;
  try {
    query = normalizePublicAffiliateSearchQuery(filters.query);
  } catch (error) {
    throw new PublicAffiliateProductCatalogError(
      "invalid-filter",
      error instanceof Error ? error.message : "Invalid public search query.",
      { cause: error },
    );
  }

  if (filters.departmentSlug !== undefined && !isDepartmentSlug(filters.departmentSlug)) {
    throw new PublicAffiliateProductCatalogError("invalid-filter", "Invalid search department filter.");
  }
  if (filters.leafSlug !== undefined && !isLeafSlug(filters.leafSlug)) {
    throw new PublicAffiliateProductCatalogError("invalid-filter", "Invalid search leaf filter.");
  }
  if (
    filters.departmentSlug !== undefined &&
    filters.leafSlug !== undefined &&
    !isDepartmentLeafPair(filters.departmentSlug, filters.leafSlug)
  ) {
    throw new PublicAffiliateProductCatalogError(
      "invalid-filter",
      "Search department and leaf filters do not match.",
    );
  }

  try {
    return { query, pageSize: normalizePublicCatalogPageSize(filters.pageSize) };
  } catch (error) {
    throw new PublicAffiliateProductCatalogError(
      "invalid-filter",
      error instanceof Error ? error.message : "Invalid catalog page size.",
      { cause: error },
    );
  }
}

function isValidSearchRow(value: unknown): value is SupabaseSearchProductRow {
  if (!isSupabasePublicProductRow(value)) return false;
  const row = value as SupabaseSearchProductRow;
  return typeof row.relevance_rank === "number" && Number.isFinite(row.relevance_rank) && row.relevance_rank >= 0;
}

function getCursorableSearchRow(value: unknown): PublicAffiliateSearchCursor | null {
  if (typeof value !== "object" || value === null) return null;
  const row = value as Record<string, unknown>;
  if (
    !isSupportedUuid(row.id) ||
    typeof row.created_at !== "string" ||
    !Number.isFinite(Date.parse(row.created_at)) ||
    typeof row.relevance_rank !== "number" ||
    !Number.isFinite(row.relevance_rank) ||
    row.relevance_rank < 0
  ) {
    return null;
  }

  try {
    return {
      rank: row.relevance_rank,
      createdAt: new Date(row.created_at).toISOString(),
      id: row.id,
    };
  } catch {
    return null;
  }
}

export async function searchPublicAffiliateProducts(
  filters: PublicAffiliateProductSearchFilters,
): Promise<PublicAffiliateCatalogPage<PublicAffiliateProductCardData>> {
  const validated = validateSearchFilters(filters);
  const cursor = filters.cursor === undefined ? null : decodePublicAffiliateSearchCursor(filters.cursor);
  if (filters.cursor !== undefined && cursor === null) {
    throw new PublicAffiliateProductCatalogError("invalid-filter", "Invalid public search cursor.");
  }
  return searchPublicAffiliateProductsCached({ ...filters, ...validated, cursor });
}

async function searchPublicAffiliateProductsCached(
  filters: Omit<PublicAffiliateProductSearchFilters, "cursor" | "pageSize"> & {
    readonly query: string;
    readonly pageSize: number;
    readonly cursor: ReturnType<typeof decodePublicAffiliateSearchCursor>;
  },
): Promise<PublicAffiliateCatalogPage<PublicAffiliateProductCardData>> {
  "use cache";
  cacheLife("affiliateCatalog");
  cacheTag("affiliate-catalog");
  cacheTag("affiliate-catalog:search");
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
  const validRows: SupabaseSearchProductRow[] = [];
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
    const { data, error } = await client.rpc("search_public_affiliate_products", {
      p_query: filters.query,
      p_department_slug: filters.departmentSlug ?? null,
      p_leaf_slug: filters.leafSlug ?? null,
      p_limit: requestedLimit,
      p_cursor_rank: cursor?.rank ?? null,
      p_cursor_created_at: cursor?.createdAt ?? null,
      p_cursor_id: cursor?.id ?? null,
    });
    attempts += 1;

    if (error) {
      throw new PublicAffiliateProductCatalogError(
        "query-failed",
        "Failed to search public affiliate products.",
        { cause: error },
      );
    }
    if (!Array.isArray(data)) {
      throw new PublicAffiliateProductCatalogError(
        "invalid-response",
        "Supabase returned an invalid public search response.",
      );
    }
    sawRows ||= data.length > 0;

    for (const row of data) {
      if (isValidSearchRow(row) && mapSupabasePublicProductRowToCard(row) !== null) {
        validRows.push(row);
      }
    }

    const lastRawCursor = data.length === 0 ? null : getCursorableSearchRow(data[data.length - 1]);
    if (data.length < requestedLimit) {
      exhausted = true;
    } else if (lastRawCursor === null) {
      throw new PublicAffiliateProductCatalogError(
        "invalid-response",
        "Supabase returned a search row without a valid pagination cursor.",
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
      "Public search returned too many invalid rows to build a reliable page.",
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
      "Supabase returned no valid public search products.",
    );
  }

  const lastRow = validRows[filters.pageSize - 1];
  const nextCursor = hasNextPage && lastRow !== undefined && lastRow.created_at !== null
    ? encodePublicAffiliateSearchCursor({
        rank: lastRow.relevance_rank,
        createdAt: lastRow.created_at,
        id: lastRow.id,
      })
    : null;

  return { items, hasNextPage: nextCursor !== null, nextCursor };
}

export type PublicAffiliateProductSearchProgressiveFilters = Omit<PublicAffiliateProductSearchFilters, "cursor" | "pageSize"> & {
  readonly pageNumber?: unknown;
  readonly startingCursor?: string;
};

export async function searchPublicAffiliateProductWindow(
  filters: PublicAffiliateProductSearchProgressiveFilters,
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
    : decodePublicAffiliateSearchCursor(startingCursor);
  if (startingCursor !== null && cursor === null) {
    throw new PublicAffiliateProductCatalogError("invalid-filter", "Invalid search starting cursor.");
  }

  let query: string;
  try {
    query = normalizePublicAffiliateSearchQuery(filters.query);
  } catch (error) {
    throw new PublicAffiliateProductCatalogError(
      "invalid-filter",
      error instanceof Error ? error.message : "Invalid public search query.",
      { cause: error },
    );
  }

  if (filters.departmentSlug !== undefined && !isDepartmentSlug(filters.departmentSlug)) {
    throw new PublicAffiliateProductCatalogError("invalid-filter", "Invalid search department filter.");
  }
  if (filters.leafSlug !== undefined && !isLeafSlug(filters.leafSlug)) {
    throw new PublicAffiliateProductCatalogError("invalid-filter", "Invalid search leaf filter.");
  }
  if (
    filters.departmentSlug !== undefined &&
    filters.leafSlug !== undefined &&
    !isDepartmentLeafPair(filters.departmentSlug, filters.leafSlug)
  ) {
    throw new PublicAffiliateProductCatalogError(
      "invalid-filter",
      "Search department and leaf filters do not match.",
    );
  }

  const pageSize = pageNumber * PUBLIC_AFFILIATE_CATALOG_PAGE_SIZE;
  const page = await searchPublicAffiliateProductsCached({
    query,
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
