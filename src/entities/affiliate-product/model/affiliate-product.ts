import {
  isAllowedAffiliateDestination,
} from "./affiliate-destination";
import {
  isDepartmentLeafPair,
  isSubcategorySlug,
  type DepartmentSlug,
  type LeafSlug,
  type SubcategorySlug,
} from "@/shared/config/affiliate-taxonomy";

import {
  isNonEmptyString,
  isNonNegativeFiniteNumber,
  isPublicCatalogImageUrl,
  isSupportedUuid,
} from "./public-product-validation";

export const affiliateMarketplaces = ["shopee", "amazon", "mercado-livre", "other"] as const;
export const classificationReviewStatuses = ["auto", "review"] as const;

export type AffiliateMarketplace = (typeof affiliateMarketplaces)[number];
export type ClassificationReviewStatus = (typeof classificationReviewStatuses)[number];

export type AffiliateProductPricing = {
  readonly priceOriginalCents: number | null;
  readonly priceDiscountCents: number | null;
};

export type AffiliateProductClassification = {
  readonly departmentSlug: DepartmentSlug;
  readonly subcategorySlug: SubcategorySlug | null;
  readonly leafSlug: LeafSlug;
  readonly classificationSource: string | null;
  readonly classificationConfidence: number | null;
  readonly classificationReviewStatus: ClassificationReviewStatus | null;
};

export type PublishableAffiliateProduct = AffiliateProductPricing &
  AffiliateProductClassification & {
    readonly id: string;
    readonly productIdShopee: string;
    readonly slug: string;
    readonly title: string;
    readonly imageUrl: string | null;
    readonly affiliateUrl: string;
    readonly marketplace: AffiliateMarketplace;
    readonly category: string | null;
    readonly isActive: true;
  };

export type PublicAffiliateProduct = AffiliateProductPricing & {
  readonly id: string;
  readonly productIdShopee: string;
  readonly slug: string;
  readonly title: string;
  readonly imageUrl: string | null;
  readonly affiliateUrl: string;
  readonly marketplace: AffiliateMarketplace;
  readonly category: string | null;
  readonly isActive: true;
  readonly departmentSlug: DepartmentSlug;
  readonly subcategorySlug: SubcategorySlug | null;
  readonly leafSlug: LeafSlug;
};

export type PublicAffiliateProductCardData = {
  readonly id: string;
  readonly title: string;
  readonly imageUrl: string | null;
  readonly priceOriginalCents: number | null;
  readonly priceDiscountCents: number | null;
  readonly marketplace: AffiliateMarketplace;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isNullableString(value: unknown): value is string | null {
  return typeof value === "string" || value === null;
}

function isNullablePrice(value: unknown): value is number | null {
  return value === null || isNonNegativeFiniteNumber(value);
}

function isClassificationReviewStatus(value: unknown): value is ClassificationReviewStatus | null {
  return value === null || (typeof value === "string" && classificationReviewStatuses.includes(value as ClassificationReviewStatus));
}

function isNullableConfidence(value: unknown): value is number | null {
  return value === null || (typeof value === "number" && value >= 0 && value <= 1);
}

function isAffiliateMarketplace(value: unknown): value is AffiliateMarketplace {
  return typeof value === "string" && affiliateMarketplaces.includes(value as AffiliateMarketplace);
}

function hasValidOptionalSubcategory(value: unknown): value is SubcategorySlug | null {
  return value === null || value === undefined || isSubcategorySlug(value);
}

function hasValidNullableNumberField(record: Record<string, unknown>, fieldName: string): boolean {
  const value = record[fieldName];
  return value === undefined || isNullablePrice(value);
}

export function isPublishableAffiliateProduct(value: unknown): value is PublishableAffiliateProduct {
  if (!isRecord(value)) {
    return false;
  }

  if (
    !isSupportedUuid(value.id) ||
    !isNonEmptyString(value.productIdShopee) ||
    !isNonEmptyString(value.slug) ||
    !isNonEmptyString(value.title) ||
    !isNullableString(value.category) ||
    !isAffiliateMarketplace(value.marketplace) ||
    !isAllowedAffiliateDestination(value.affiliateUrl, value.marketplace) ||
    value.isActive !== true
  ) {
    return false;
  }

  if (value.imageUrl !== null && !isPublicCatalogImageUrl(value.imageUrl)) {
    return false;
  }

  if (
    !hasValidNullableNumberField(value, "priceOriginalCents") ||
    !hasValidNullableNumberField(value, "priceDiscountCents") ||
    !isNullableString(value.classificationSource) ||
    !isNullableConfidence(value.classificationConfidence) ||
    !isClassificationReviewStatus(value.classificationReviewStatus)
  ) {
    return false;
  }

  return (
    hasValidOptionalSubcategory(value.subcategorySlug) &&
    isDepartmentLeafPair(value.departmentSlug, value.leafSlug)
  );
}

export function isPublicAffiliateProduct(value: unknown): value is PublicAffiliateProduct {
  if (!isRecord(value)) return false;

  return (
    isSupportedUuid(value.id) &&
    isNonEmptyString(value.productIdShopee) &&
    isNonEmptyString(value.slug) &&
    isNonEmptyString(value.title) &&
    isAffiliateMarketplace(value.marketplace) &&
    isAllowedAffiliateDestination(value.affiliateUrl, value.marketplace) &&
    isNullableString(value.category) &&
    value.isActive === true &&
    (value.imageUrl === null || isPublicCatalogImageUrl(value.imageUrl)) &&
    hasValidNullableNumberField(value, "priceOriginalCents") &&
    hasValidNullableNumberField(value, "priceDiscountCents") &&
    hasValidOptionalSubcategory(value.subcategorySlug) &&
    isDepartmentLeafPair(value.departmentSlug, value.leafSlug)
  );
}
