import type { DepartmentSlug, LeafSlug, SubcategorySlug } from "@/shared/config/affiliate-taxonomy";

export type AffiliateReviewProduct = {
  readonly id: string;
  readonly productIdShopee: string;
  readonly title: string;
  readonly imageUrl: string;
  readonly category: string | null;
  readonly confidence: number | null;
  readonly suggestedDepartmentSlug: DepartmentSlug | null;
  readonly suggestedSubcategorySlug: SubcategorySlug | null;
  readonly suggestedLeafSlug: LeafSlug | null;
  readonly reasons: readonly string[];
  readonly revision: number;
  readonly classificationUpdatedAt: string;
  readonly createdAt: string | null;
};

export type AffiliateReviewCursor = {
  readonly updatedAt: string;
  readonly id: string;
};

export type AffiliateReviewPage = {
  readonly items: readonly AffiliateReviewProduct[];
  readonly nextCursor: string | null;
};

export type AffiliateReviewMutationResponse = {
  readonly id: string;
  readonly classificationRevision: number;
  readonly publicEligible: boolean;
};
