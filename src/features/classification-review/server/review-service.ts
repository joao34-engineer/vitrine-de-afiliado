import "server-only";

import { revalidateTag } from "next/cache";

import {
  AffiliateProductAdminRepository,
  type AffiliateProductAdminRepositoryError,
} from "@/entities/affiliate-product/api/admin-affiliate-product-repository";
import {
  findLeafBySlug,
  isDepartmentLeafPair,
  listDepartments,
  listLeaves,
  type LeafSlug,
} from "@/shared/config/affiliate-taxonomy";
import { isSupportedUuid } from "@/entities/affiliate-product";
import type { AffiliateReviewMutationResponse, AffiliateReviewPage } from "@/entities/affiliate-product/model/affiliate-review";

const REVIEW_PAGE_DEFAULT = 50;
const REVIEW_PAGE_MAX = 100;

export class ClassificationReviewValidationError extends Error {
  readonly code = "classification_review_validation_error" as const;
}

export class ClassificationReviewConflictError extends Error {
  readonly code = "classification_review_conflict" as const;
}

export class ClassificationReviewNotFoundError extends Error {
  readonly code = "classification_review_not_found" as const;
}

export class ClassificationReviewCacheInvalidationError extends Error {
  readonly code = "classification_review_cache_invalidation_error" as const;

  constructor(options?: { cause?: unknown }) {
    super("Classification was saved but public catalog cache invalidation failed.", options);
    this.name = "ClassificationReviewCacheInvalidationError";
  }
}

type ReviewDependencies = {
  readonly repository: Pick<
    AffiliateProductAdminRepository,
    "listReviews" | "getState" | "approve" | "deactivate"
  >;
  readonly revalidateCatalog: () => void;
};

const defaultDependencies: ReviewDependencies = {
  repository: new AffiliateProductAdminRepository(),
  revalidateCatalog: () => revalidateTag("affiliate-catalog", "max"),
};

function normalizeLimit(value: unknown): number {
  if (value === undefined || value === null || value === "") return REVIEW_PAGE_DEFAULT;
  const numberValue = typeof value === "number" ? value : Number(value);
  if (!Number.isInteger(numberValue) || numberValue < 1 || numberValue > REVIEW_PAGE_MAX) {
    throw new ClassificationReviewValidationError("Review limit must be an integer between 1 and 100.");
  }
  return numberValue;
}

function requireProductId(value: unknown): string {
  if (!isSupportedUuid(value)) throw new ClassificationReviewValidationError("Invalid product id.");
  return value;
}

function requireRevision(value: unknown): number {
  const revision = typeof value === "number" ? value : Number(value);
  if (!Number.isSafeInteger(revision) || revision < 0) {
    throw new ClassificationReviewValidationError("Invalid classification revision.");
  }
  return revision;
}

export function getAffiliateTaxonomyForReview() {
  return {
    version: "affiliate-taxonomy-v1",
    departments: listDepartments(),
    leaves: listLeaves(),
  } as const;
}

export async function listClassificationReviews(
  limitValue: unknown,
  cursor: string | null,
  dependencies: ReviewDependencies = defaultDependencies,
): Promise<AffiliateReviewPage> {
  return dependencies.repository.listReviews(normalizeLimit(limitValue), cursor);
}

export async function approveClassificationReview(
  productIdValue: unknown,
  leafSlugValue: unknown,
  expectedRevisionValue: unknown,
  operationIdValue: unknown,
  dependencies: ReviewDependencies = defaultDependencies,
): Promise<AffiliateReviewMutationResponse> {
  const productId = requireProductId(productIdValue);
  if (typeof leafSlugValue !== "string" || !findLeafBySlug(leafSlugValue)) {
    throw new ClassificationReviewValidationError("Invalid canonical leaf slug.");
  }
  const leaf = findLeafBySlug(leafSlugValue) as NonNullable<ReturnType<typeof findLeafBySlug>>;
  if (!isDepartmentLeafPair(leaf.departmentSlug, leaf.slug)) {
    throw new ClassificationReviewValidationError("Leaf does not have a valid department pair.");
  }
  const expectedRevision = requireRevision(expectedRevisionValue);
  if (!isSupportedUuid(operationIdValue)) {
    throw new ClassificationReviewValidationError("Invalid operation id.");
  }
  const result = await dependencies.repository.approve(
    productId,
    leaf.departmentSlug,
    leaf.subcategorySlug,
    leaf.slug as LeafSlug,
    expectedRevision,
    operationIdValue,
  );

  if (result !== null) {
    try {
      dependencies.revalidateCatalog();
    } catch (error) {
      throw new ClassificationReviewCacheInvalidationError({ cause: error });
    }
    return result;
  }

  const state = await dependencies.repository.getState(productId);
  if (state === null) throw new ClassificationReviewNotFoundError("Product not found.");
  if (
    state.classificationReviewStatus === "auto" &&
    state.classificationSource === "manual-review-v1" &&
    state.leafSlug === leaf.slug &&
    state.classificationRevision === expectedRevision + 1 &&
    state.classificationLastOperationId === operationIdValue &&
    state.classificationLastOperationKind === "approve"
  ) {
    return { id: state.id, classificationRevision: state.classificationRevision, publicEligible: state.isActive };
  }
  throw new ClassificationReviewConflictError("Product review changed before approval.");
}

export async function deactivateClassificationReview(
  productIdValue: unknown,
  expectedRevisionValue: unknown,
  operationIdValue: unknown,
  dependencies: ReviewDependencies = defaultDependencies,
): Promise<AffiliateReviewMutationResponse> {
  const productId = requireProductId(productIdValue);
  const expectedRevision = requireRevision(expectedRevisionValue);
  if (!isSupportedUuid(operationIdValue)) {
    throw new ClassificationReviewValidationError("Invalid operation id.");
  }
  const result = await dependencies.repository.deactivate(productId, expectedRevision, operationIdValue);
  if (result !== null) {
    try {
      dependencies.revalidateCatalog();
    } catch (error) {
      throw new ClassificationReviewCacheInvalidationError({ cause: error });
    }
    return result;
  }

  const state = await dependencies.repository.getState(productId);
  if (state === null) throw new ClassificationReviewNotFoundError("Product not found.");
  if (
    !state.isActive &&
    state.classificationRevision === expectedRevision + 1 &&
    state.classificationLastOperationId === operationIdValue &&
    state.classificationLastOperationKind === "deactivate"
  ) {
    return { id: state.id, classificationRevision: state.classificationRevision, publicEligible: false };
  }
  throw new ClassificationReviewConflictError("Product review changed before deactivation.");
}

export function isClassificationReviewRepositoryError(error: unknown): error is AffiliateProductAdminRepositoryError {
  return error instanceof Error && error.name === "AffiliateProductAdminRepositoryError";
}
