import type { SupabasePublicProductRow, SupabasePublicAffiliateProductDetailRow } from "@/types/supabase";

import {
  isDepartmentLeafPair,
  isDepartmentSlug,
  isLeafSlug,
  isSubcategorySlug,
} from "@/shared/config/affiliate-taxonomy";
import { isAllowedAffiliateDestination } from "./affiliate-destination";

import {
  isNonEmptyString,
  isNonNegativeFiniteNumber,
  isPublicCatalogImageUrl,
  isSupportedUuid,
  isValidCatalogDate,
} from "./public-product-validation";

function isNullableString(value: unknown): value is string | null {
  return value === null || typeof value === "string";
}

export function isSupabasePublicProductRow(
  value: unknown,
): value is SupabasePublicProductRow {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const row = value as Record<string, unknown>;
  return (
    isSupportedUuid(row.id) &&
    isNonEmptyString(row.product_id_shopee) &&
    isNonEmptyString(row.title) &&
    isNonNegativeFiniteNumber(row.price_original) &&
    isNonNegativeFiniteNumber(row.price_discount) &&
    isPublicCatalogImageUrl(row.image_url) &&
    isNullableString(row.category) &&
    row.is_active === true &&
    isValidCatalogDate(row.created_at) &&
    isDepartmentSlug(row.department_slug) &&
    isLeafSlug(row.leaf_slug) &&
    (row.subcategory_slug === null || isSubcategorySlug(row.subcategory_slug)) &&
    isDepartmentLeafPair(row.department_slug, row.leaf_slug)
  );
}

export function isSupabasePublicAffiliateProductDetailRow(
  value: unknown,
): value is SupabasePublicAffiliateProductDetailRow {
  return isSupabasePublicProductRow(value) &&
    isAllowedAffiliateDestination(
      (value as Record<string, unknown>).shopee_affiliate_link,
      "shopee",
    );
}
