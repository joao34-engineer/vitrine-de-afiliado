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
  type PublicAffiliateProductSearchRequest,
} from "../model/affiliate-search";
import type { PublicAffiliateProductCardData } from "../model/affiliate-product";
import { mapSupabasePublicProductRowToCard } from "../model/affiliate-product-mapper";
import { isSupabasePublicProductRow } from "../model/public-affiliate-product-row";
import { PublicAffiliateProductCatalogError } from "../model/public-affiliate-product-catalog-error";
import {
  PUBLIC_AFFILIATE_CATALOG_PAGE_SIZE,
  normalizePublicCatalogPageSize,
  type PublicAffiliateCatalogPage,
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

  const { data, error } = await createPublicSupabaseClient().rpc(
    "search_public_affiliate_products",
    {
      p_query: filters.query,
      p_department_slug: filters.departmentSlug ?? null,
      p_leaf_slug: filters.leafSlug ?? null,
      p_limit: Math.min(filters.pageSize + 1, PUBLIC_AFFILIATE_CATALOG_PAGE_SIZE + 1),
      p_cursor_rank: filters.cursor?.rank ?? null,
      p_cursor_created_at: filters.cursor?.createdAt ?? null,
      p_cursor_id: filters.cursor?.id ?? null,
    },
  );

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

  const rows = data.filter(isValidSearchRow);
  const hasNextPage = data.length > filters.pageSize;
  const items = rows
    .slice(0, filters.pageSize)
    .map(mapSupabasePublicProductRowToCard)
    .filter((product): product is PublicAffiliateProductCardData => product !== null);

  if (data.length > 0 && items.length === 0) {
    throw new PublicAffiliateProductCatalogError(
      "invalid-response",
      "Supabase returned no valid public search products.",
    );
  }

  const lastRow = rows[Math.min(filters.pageSize, rows.length) - 1];
  const nextCursor = hasNextPage && lastRow !== undefined && lastRow.created_at !== null
    ? encodePublicAffiliateSearchCursor({
        rank: lastRow.relevance_rank,
        createdAt: lastRow.created_at,
        id: lastRow.id,
      })
    : null;

  return { items, hasNextPage: nextCursor !== null, nextCursor };
}
