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
  type PublicAffiliateCatalogPage,
} from "../model/affiliate-catalog-pagination";
import { mapSupabasePublicProductRowToCard } from "../model/affiliate-product-mapper";
import { isSupabasePublicProductRow } from "../model/public-affiliate-product-row";
import type { PublicAffiliateProductCardData } from "../model/affiliate-product";
import type { SupabasePublicProductRow } from "@/types/supabase";
import { PublicAffiliateProductCatalogError } from "../model/public-affiliate-product-catalog-error";
import { PUBLIC_AFFILIATE_PRODUCT_CATALOG_SELECT } from "../model/public-affiliate-product-select";

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

function hasCursorableCreatedAt(row: SupabasePublicProductRow): boolean {
  return row.created_at !== null && Number.isFinite(Date.parse(row.created_at));
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

  let query = createPublicSupabaseClient()
    .from("products")
    .select(PUBLIC_AFFILIATE_PRODUCT_CATALOG_SELECT)
    .eq("is_active", true)
    .eq("classification_review_status", "auto")
    .not("department_slug", "is", null)
    .not("leaf_slug", "is", null)
    .not("created_at", "is", null);

  if (filters.departmentSlug !== undefined) {
    query = query.eq("department_slug", filters.departmentSlug);
  }

  if (filters.leafSlug !== undefined) {
    query = query.eq("leaf_slug", filters.leafSlug);
  }

  if (filters.cursor !== undefined && filters.cursor !== null) {
    query = query.or(
      `created_at.lt.${filters.cursor.createdAt},and(created_at.eq.${filters.cursor.createdAt},id.gt.${filters.cursor.id})`,
    );
  }

  const { data, error } = await query
    .order("created_at", { ascending: false, nullsFirst: false })
    .order("id", { ascending: true })
    .limit(filters.pageSize + 1);

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

  const hasNextPage = rows.length > filters.pageSize;
  const validRows = rows
    .filter(isSupabasePublicProductRow)
    .filter(hasCursorableCreatedAt);
  const items = validRows
    .slice(0, filters.pageSize)
    .map(mapSupabasePublicProductRowToCard)
    .filter((product): product is PublicAffiliateProductCardData => product !== null);

  if (rows.length > 0 && items.length === 0) {
    throw new PublicAffiliateProductCatalogError(
      "invalid-response",
      "Supabase returned no valid public affiliate products.",
    );
  }

  const lastRow = validRows[Math.min(filters.pageSize, validRows.length) - 1];
  const nextCursor = hasNextPage && lastRow?.created_at !== null && lastRow !== undefined
    ? encodePublicAffiliateProductCursor({ createdAt: lastRow.created_at, id: lastRow.id })
    : null;

  return {
    items,
    hasNextPage: nextCursor !== null,
    nextCursor,
  };
}
