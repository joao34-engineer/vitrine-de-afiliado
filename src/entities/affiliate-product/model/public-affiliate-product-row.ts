import type { SupabasePublicProductRow, SupabasePublicAffiliateProductDetailRow } from "@/types/supabase";

function isNullableNumber(value: unknown): value is number | null {
  return value === null || (typeof value === "number" && Number.isFinite(value));
}

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
    typeof row.id === "string" &&
    typeof row.product_id_shopee === "string" &&
    typeof row.title === "string" &&
    typeof row.price_original === "number" &&
    Number.isFinite(row.price_original) &&
    typeof row.price_discount === "number" &&
    Number.isFinite(row.price_discount) &&
    typeof row.image_url === "string" &&
    isNullableString(row.category) &&
    typeof row.is_active === "boolean" &&
    isNullableString(row.created_at) &&
    isNullableString(row.department_slug) &&
    isNullableString(row.subcategory_slug) &&
    isNullableString(row.leaf_slug) &&
    isNullableString(row.classification_source) &&
    isNullableNumber(row.classification_confidence) &&
    isNullableString(row.classification_review_status)
  );
}

export function isSupabasePublicAffiliateProductDetailRow(
  value: unknown,
): value is SupabasePublicAffiliateProductDetailRow {
  return isSupabasePublicProductRow(value) &&
    typeof (value as Record<string, unknown>).shopee_affiliate_link === "string";
}
