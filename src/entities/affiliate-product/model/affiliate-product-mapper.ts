import {
  isPublicAffiliateProduct,
  isPublishableAffiliateProduct,
  type PublicAffiliateProduct,
  type PublishableAffiliateProduct,
} from "./affiliate-product";
import type { SupabaseProductRow } from "@/types/supabase";
import type { SupabasePublicProductRow } from "@/types/supabase";
import type { SupabasePublicAffiliateProductDetailRow } from "@/types/supabase";
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
  | "created_at"
  | "department_slug"
  | "subcategory_slug"
  | "leaf_slug"
  | "classification_source"
  | "classification_confidence"
  | "classification_review_status"
>;

function toCents(value: unknown): number | null {
  return isNonNegativeFiniteNumber(value) ? Math.round(value * 100) : null;
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
    !isSupportedUuid(row.id) ||
    !isNonEmptyString(row.product_id_shopee) ||
    !isNonEmptyString(row.title) ||
    !isPublicCatalogImageUrl(row.image_url) ||
    !isAllowedAffiliateDestination(row.shopee_affiliate_link, "shopee") ||
    !isValidCatalogDate(row.created_at)
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
  if (product === null || product.classificationReviewStatus !== "auto") {
    return null;
  }

  return {
    id: product.id,
    productIdShopee: product.productIdShopee,
    slug: product.slug,
    title: product.title,
    imageUrl: product.imageUrl,
    affiliateUrl: product.affiliateUrl,
    marketplace: product.marketplace,
    category: product.category,
    isActive: product.isActive,
    priceOriginalCents: product.priceOriginalCents,
    priceDiscountCents: product.priceDiscountCents,
    departmentSlug: product.departmentSlug,
    subcategorySlug: product.subcategorySlug,
    leafSlug: product.leafSlug,
  };
}

export function mapSupabasePublicAffiliateProductDetailRow(
  row: SupabasePublicAffiliateProductDetailRow,
): PublicAffiliateProduct | null {
  const originalPriceCents = toCents(row.price_original);
  const discountPriceCents = toCents(row.price_discount);

  if (
    !isSupportedUuid(row.id) ||
    !isNonEmptyString(row.product_id_shopee) ||
    !isNonEmptyString(row.title) ||
    originalPriceCents === null ||
    discountPriceCents === null ||
    !isPublicCatalogImageUrl(row.image_url) ||
    !isAllowedAffiliateDestination(row.shopee_affiliate_link, "shopee") ||
    !isValidCatalogDate(row.created_at) ||
    row.is_active !== true ||
    !isDepartmentSlug(row.department_slug) ||
    !isLeafSlug(row.leaf_slug) ||
    (row.subcategory_slug !== null && !isSubcategorySlug(row.subcategory_slug)) ||
    !isDepartmentLeafPair(row.department_slug, row.leaf_slug)
  ) {
    return null;
  }

  const product: PublicAffiliateProduct = {
    id: row.id,
    productIdShopee: row.product_id_shopee,
    slug: deriveAffiliateProductSlug(row),
    title: row.title,
    imageUrl: row.image_url,
    affiliateUrl: row.shopee_affiliate_link,
    marketplace: "shopee",
    category: row.category,
    isActive: true,
    priceOriginalCents: originalPriceCents,
    priceDiscountCents: discountPriceCents,
    departmentSlug: row.department_slug,
    subcategorySlug: row.subcategory_slug,
    leafSlug: row.leaf_slug,
  };

  return isPublicAffiliateProduct(product) ? product : null;
}

export function mapSupabasePublicProductRowToCard(
  row: SupabasePublicProductRow,
): import("./affiliate-product").PublicAffiliateProductCardData | null {
  const originalPriceCents = toCents(row.price_original);
  const discountPriceCents = toCents(row.price_discount);

  if (
    !isSupportedUuid(row.id) ||
    !isNonEmptyString(row.product_id_shopee) ||
    !isNonEmptyString(row.title) ||
    originalPriceCents === null ||
    discountPriceCents === null ||
    !isPublicCatalogImageUrl(row.image_url) ||
    !isValidCatalogDate(row.created_at) ||
    row.is_active !== true ||
    row.department_slug === null ||
    row.leaf_slug === null ||
    (row.subcategory_slug !== null && !isSubcategorySlug(row.subcategory_slug)) ||
    !isDepartmentLeafPair(row.department_slug, row.leaf_slug)
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
