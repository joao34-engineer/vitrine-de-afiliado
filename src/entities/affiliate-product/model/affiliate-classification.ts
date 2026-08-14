import {
  classifyAffiliateProduct,
  type AffiliateClassificationReason,
  type AffiliateClassificationStatus,
} from "./affiliate-classification-core";

export const legacyBackfillClassificationSource = "legacy-backfill-v1" as const;
export const legacyClassificationStatuses = ["auto", "review"] as const;

export type LegacyBackfillClassificationSource = typeof legacyBackfillClassificationSource;
export type LegacyClassificationStatus = AffiliateClassificationStatus;
export type LegacyClassificationReason = AffiliateClassificationReason;

export type LegacyAffiliateProductInput = {
  readonly id: string;
  readonly title: string;
  readonly aiCopy: string | null;
  readonly category: string | null;
  readonly isActive: boolean;
};

export type LegacyAffiliateProductClassification = {
  readonly status: LegacyClassificationStatus;
  readonly departmentSlug: ReturnType<typeof classifyAffiliateProduct>["departmentSlug"];
  readonly subcategorySlug: ReturnType<typeof classifyAffiliateProduct>["subcategorySlug"];
  readonly leafSlug: ReturnType<typeof classifyAffiliateProduct>["leafSlug"];
  readonly classificationSource: LegacyBackfillClassificationSource;
  readonly classificationConfidence: number;
  readonly classificationReviewStatus: LegacyClassificationStatus;
  readonly reasons: readonly LegacyClassificationReason[];
};

export type ClassifiedLegacyAffiliateProduct = {
  readonly product: LegacyAffiliateProductInput;
  readonly classification: LegacyAffiliateProductClassification;
};

export type LegacyAffiliateProductsClassificationBatch = {
  readonly all: readonly ClassifiedLegacyAffiliateProduct[];
  readonly auto: readonly ClassifiedLegacyAffiliateProduct[];
  readonly review: readonly ClassifiedLegacyAffiliateProduct[];
};

export function classifyLegacyAffiliateProduct(
  product: LegacyAffiliateProductInput,
): LegacyAffiliateProductClassification {
  const decision = classifyAffiliateProduct(product);

  return {
    status: decision.status,
    departmentSlug: decision.departmentSlug,
    subcategorySlug: decision.subcategorySlug,
    leafSlug: decision.leafSlug,
    classificationSource: legacyBackfillClassificationSource,
    classificationConfidence: decision.confidence,
    classificationReviewStatus: decision.status,
    reasons: decision.reasons,
  };
}

export function classifyLegacyAffiliateProducts(
  products: readonly LegacyAffiliateProductInput[],
): LegacyAffiliateProductsClassificationBatch {
  const all = products.map((product) => ({ product, classification: classifyLegacyAffiliateProduct(product) }));
  return {
    all,
    auto: all.filter((item) => item.classification.status === "auto"),
    review: all.filter((item) => item.classification.status === "review"),
  };
}
