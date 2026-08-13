import {
  isPublicAffiliateProduct,
  isPublishableAffiliateProduct,
  type PublicAffiliateProduct,
  type PublishableAffiliateProduct,
} from "./affiliate-product";
import type { SupabaseProductRow } from "@/types/supabase";
import type { SupabasePublicProductRow } from "@/types/supabase";
import { isDepartmentLeafPair, isSubcategorySlug } from "@/shared/config/affiliate-taxonomy";

type SupabaseProductMappingRow = Pick<
  SupabaseProductRow,
  | "id"
  | "product_id_shopee"
  | "title"
  | "price_original"
  | "price_discount"
  | "image_url"
  | "shopee_affiliate_link"
  | "category"
  | "is_active"
  | "department_slug"
  | "subcategory_slug"
  | "leaf_slug"
  | "classification_source"
  | "classification_confidence"
  | "classification_review_status"
>;

function toCents(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? Math.round(value * 100) : null;
}

function isHttpUrl(value: unknown): value is string {
  if (typeof value !== "string" || value.trim().length === 0) {
    return false;
  }

  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function toSlugSegment(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function deriveAffiliateProductSlug(row: Pick<SupabaseProductRow, "product_id_shopee">): string {
  const productId = toSlugSegment(row.product_id_shopee);
  return productId.length > 0 ? `shopee-${productId}` : "";
}

export function mapSupabaseProductRowToPublishableAffiliateProduct(
  row: SupabaseProductMappingRow,
): PublishableAffiliateProduct | null {
  const originalPriceCents = toCents(row.price_original);
  const discountPriceCents = toCents(row.price_discount);

  if (
    originalPriceCents === null ||
    discountPriceCents === null ||
    !isHttpUrl(row.image_url) ||
    !isHttpUrl(row.shopee_affiliate_link)
  ) {
    return null;
  }

  if (
    row.classification_confidence !== null &&
    (typeof row.classification_confidence !== "number" ||
      !Number.isFinite(row.classification_confidence) ||
      row.classification_confidence < 0 ||
      row.classification_confidence > 1)
  ) {
    return null;
  }

  const product = {
    id: row.id,
    productIdShopee: row.product_id_shopee,
    slug: deriveAffiliateProductSlug(row),
    title: row.title,
    imageUrl: row.image_url,
    affiliateUrl: row.shopee_affiliate_link,
    marketplace: "shopee",
    category: row.category,
    isActive: row.is_active,
    priceOriginalCents: originalPriceCents,
    priceDiscountCents: discountPriceCents,
    departmentSlug: row.department_slug,
    subcategorySlug: row.subcategory_slug,
    leafSlug: row.leaf_slug,
    classificationSource: row.classification_source,
    classificationConfidence: row.classification_confidence,
    classificationReviewStatus: row.classification_review_status,
  };

  return isPublishableAffiliateProduct(product) ? product : null;
}

export function mapSupabaseProductRowToPublicAffiliateProduct(
  row: SupabaseProductMappingRow,
): PublicAffiliateProduct | null {
  const product = mapSupabaseProductRowToPublishableAffiliateProduct(row);
  return product !== null && isPublicAffiliateProduct(product) ? product : null;
}

export function mapSupabasePublicProductRowToCard(
  row: SupabasePublicProductRow,
): import("./affiliate-product").PublicAffiliateProductCardData | null {
  const originalPriceCents = toCents(row.price_original);
  const discountPriceCents = toCents(row.price_discount);

  if (
    row.id.trim().length === 0 ||
    row.product_id_shopee.trim().length === 0 ||
    row.title.trim().length === 0 ||
    originalPriceCents === null ||
    discountPriceCents === null ||
    !isHttpUrl(row.image_url) ||
    row.is_active !== true ||
    row.classification_review_status !== "auto" ||
    row.department_slug === null ||
    row.leaf_slug === null ||
    (row.subcategory_slug !== null && !isSubcategorySlug(row.subcategory_slug)) ||
    !isDepartmentLeafPair(row.department_slug, row.leaf_slug) ||
    (row.classification_confidence !== null &&
      (row.classification_confidence < 0 || row.classification_confidence > 1))
  ) {
    return null;
  }

  return {
    id: row.id,
    title: row.title,
    imageUrl: row.image_url,
    priceOriginalCents: originalPriceCents,
    priceDiscountCents: discountPriceCents,
    marketplace: "shopee",
  };
}
