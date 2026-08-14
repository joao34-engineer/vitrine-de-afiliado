import {
  classifyAffiliateProduct,
  type AffiliateClassificationInput,
  type AffiliateClassificationReason,
} from "./affiliate-classification-core";
import type { DepartmentSlug, LeafSlug, SubcategorySlug } from "@/shared/config/affiliate-taxonomy";

export const affiliateIngestionClassificationSource = "ingest-rules-v1" as const;
export type AffiliateIngestionClassificationSource = typeof affiliateIngestionClassificationSource;

export type AffiliateIngestionClassificationInput = {
  readonly title: string;
  readonly aiCopy: string | null;
  readonly legacyCategory: string | null;
};

export type AffiliateIngestionClassification = {
  readonly status: "auto" | "review";
  readonly departmentSlug: DepartmentSlug | null;
  readonly subcategorySlug: SubcategorySlug | null;
  readonly leafSlug: LeafSlug | null;
  readonly suggestedDepartmentSlug: DepartmentSlug | null;
  readonly suggestedSubcategorySlug: SubcategorySlug | null;
  readonly suggestedLeafSlug: LeafSlug | null;
  readonly confidence: number;
  readonly reasons: readonly AffiliateClassificationReason[];
  readonly source: AffiliateIngestionClassificationSource;
};

export function classifyAffiliateProductForIngestion(
  input: AffiliateIngestionClassificationInput,
): AffiliateIngestionClassification {
  const decision = classifyAffiliateProduct({
    title: input.title,
    aiCopy: input.aiCopy,
    category: input.legacyCategory,
    isActive: true,
  } satisfies AffiliateClassificationInput);

  return {
    status: decision.status,
    departmentSlug: decision.departmentSlug,
    subcategorySlug: decision.subcategorySlug,
    leafSlug: decision.leafSlug,
    suggestedDepartmentSlug: decision.suggestedDepartmentSlug,
    suggestedSubcategorySlug: decision.suggestedSubcategorySlug,
    suggestedLeafSlug: decision.suggestedLeafSlug,
    confidence: decision.confidence,
    reasons: decision.reasons,
    source: affiliateIngestionClassificationSource,
  };
}
