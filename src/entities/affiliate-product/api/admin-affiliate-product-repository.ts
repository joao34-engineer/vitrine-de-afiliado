import "server-only";

import { createServerSupabaseClient } from "@/shared/api/supabase/index.server";
import {
  isDepartmentSlug,
  findLeafBySlug,
  isLeafSlug,
  isSubcategorySlug,
  isDepartmentLeafPair,
  type DepartmentSlug,
  type LeafSlug,
  type SubcategorySlug,
} from "@/shared/config/affiliate-taxonomy";
import type {
  SupabaseAffiliateProductClassificationMutationResult,
  SupabaseAffiliateProductIngestionResult,
  SupabaseReviewProductRow,
} from "@/types/supabase";

import type { AffiliateIngestionClassification } from "../model/affiliate-ingestion-classification";
import type { AffiliateProductIngestionRequest } from "../model/affiliate-ingestion";
import { decodeAffiliateReviewCursor, encodeAffiliateReviewCursor } from "../model/affiliate-review-cursor";
import type {
  AffiliateReviewMutationResponse,
  AffiliateReviewPage,
  AffiliateReviewProduct,
} from "../model/affiliate-review";
import {
  isNonEmptyString,
  isPublicCatalogImageUrl,
  isSupportedUuid,
  isValidCatalogDate,
} from "../model/public-product-validation";

const REVIEW_SELECT = [
  "id",
  "product_id_shopee",
  "title",
  "image_url",
  "category",
  "is_active",
  "classification_review_status",
  "classification_confidence",
  "classification_suggested_department_slug",
  "classification_suggested_subcategory_slug",
  "classification_suggested_leaf_slug",
  "classification_reasons",
  "classification_revision",
  "classification_updated_at",
  "created_at",
].join(",");

export class AffiliateProductAdminRepositoryError extends Error {
  readonly code = "affiliate_product_admin_repository_error" as const;

  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = "AffiliateProductAdminRepositoryError";
  }
}

type AdminProductState = {
  readonly id: string;
  readonly isActive: boolean;
  readonly classificationReviewStatus: "auto" | "review" | null;
  readonly classificationSource: string | null;
  readonly leafSlug: LeafSlug | null;
  readonly classificationRevision: number;
  readonly classificationLastOperationId: string | null;
  readonly classificationLastOperationKind: "approve" | "deactivate" | null;
};

function asReviewProduct(value: unknown): AffiliateReviewProduct {
  if (typeof value !== "object" || value === null) {
    throw new AffiliateProductAdminRepositoryError("Supabase returned a malformed review row.");
  }

  const row = value as Partial<SupabaseReviewProductRow>;
  const reviewRevision = row.classification_revision;
  if (
    !isSupportedUuid(row.id) ||
    !isNonEmptyString(row.product_id_shopee) ||
    !isNonEmptyString(row.title) ||
    !isPublicCatalogImageUrl(row.image_url) ||
    typeof reviewRevision !== "number" ||
    !Number.isSafeInteger(reviewRevision) ||
    reviewRevision < 0 ||
    !isValidCatalogDate(row.classification_updated_at) ||
    row.is_active !== true ||
    row.classification_review_status !== "review" ||
    (row.category !== null && typeof row.category !== "string") ||
    (row.classification_confidence !== null &&
      (typeof row.classification_confidence !== "number" ||
        !Number.isFinite(row.classification_confidence) ||
        row.classification_confidence < 0 ||
        row.classification_confidence > 1)) ||
    !Array.isArray(row.classification_reasons) ||
    row.classification_reasons.length === 0 ||
    row.classification_reasons.some((reason) => !isNonEmptyString(reason)) ||
    (row.created_at !== null && row.created_at !== undefined && !isValidCatalogDate(row.created_at))
  ) {
    throw new AffiliateProductAdminRepositoryError("Supabase returned an invalid review product.");
  }

  const department = row.classification_suggested_department_slug;
  const subcategory = row.classification_suggested_subcategory_slug;
  const leaf = row.classification_suggested_leaf_slug;
  if (
    (department !== null && !isDepartmentSlug(department)) ||
    (subcategory !== null && !isSubcategorySlug(subcategory)) ||
    (leaf !== null && !isLeafSlug(leaf)) ||
    (leaf === null && (department !== null || subcategory !== null)) ||
    (leaf !== null &&
      (!isDepartmentLeafPair(department, leaf) ||
        findLeafBySlug(leaf)?.subcategorySlug !== subcategory))
  ) {
    throw new AffiliateProductAdminRepositoryError("Supabase returned invalid review taxonomy suggestion.");
  }

  return {
    id: row.id,
    productIdShopee: row.product_id_shopee,
    title: row.title,
    imageUrl: row.image_url,
    category: row.category,
    confidence: row.classification_confidence,
    suggestedDepartmentSlug: department as DepartmentSlug | null,
    suggestedSubcategorySlug: subcategory as SubcategorySlug | null,
    suggestedLeafSlug: leaf as LeafSlug | null,
    reasons: row.classification_reasons,
    revision: reviewRevision,
    classificationUpdatedAt: row.classification_updated_at,
    createdAt: row.created_at ?? null,
  };
}

function asIngestionResult(value: unknown): SupabaseAffiliateProductIngestionResult {
  if (typeof value !== "object" || value === null) {
    throw new AffiliateProductAdminRepositoryError("Supabase returned a malformed ingestion result.");
  }

  const result = value as Partial<SupabaseAffiliateProductIngestionResult>;
  const ingestionRevision = result.classification_revision;
  if (
    !isSupportedUuid(result.id) ||
    typeof result.product_id_shopee !== "string" ||
    typeof result.previous_public_eligible !== "boolean" ||
    typeof result.public_eligible !== "boolean" ||
    typeof ingestionRevision !== "number" ||
    !Number.isSafeInteger(ingestionRevision) ||
    ingestionRevision < 0 ||
    typeof result.changed !== "boolean" ||
    typeof result.created !== "boolean" ||
    (result.classification_review_status !== "auto" && result.classification_review_status !== "review" && result.classification_review_status !== null)
  ) {
    throw new AffiliateProductAdminRepositoryError("Supabase returned an invalid ingestion result.");
  }

  return result as SupabaseAffiliateProductIngestionResult;
}

function asMutationResult(value: unknown): SupabaseAffiliateProductClassificationMutationResult {
  if (typeof value !== "object" || value === null) {
    throw new AffiliateProductAdminRepositoryError("Supabase returned a malformed mutation result.");
  }

  const result = value as Partial<SupabaseAffiliateProductClassificationMutationResult>;
  const mutationRevision = result.classification_revision;
  if (
    !isSupportedUuid(result.id) ||
    typeof result.public_eligible !== "boolean" ||
    typeof mutationRevision !== "number" ||
    !Number.isSafeInteger(mutationRevision) ||
    mutationRevision < 0 ||
    typeof result.changed !== "boolean"
  ) {
    throw new AffiliateProductAdminRepositoryError("Supabase returned an invalid mutation result.");
  }

  return result as SupabaseAffiliateProductClassificationMutationResult;
}

export class AffiliateProductAdminRepository {
  async upsertIngestion(
    product: AffiliateProductIngestionRequest,
    classification: AffiliateIngestionClassification,
  ): Promise<SupabaseAffiliateProductIngestionResult> {
    const { data, error } = await createServerSupabaseClient().rpc("upsert_affiliate_product_ingestion", {
      p_product_id_shopee: product.productIdShopee,
      p_title: product.title,
      p_price_original: product.priceOriginal,
      p_price_discount: product.priceDiscount,
      p_image_url: product.imageUrl,
      p_shopee_affiliate_link: product.affiliateUrl,
      p_ai_copy: product.aiCopy,
      p_category: product.legacyCategory,
      p_department_slug: classification.status === "auto" ? classification.departmentSlug : null,
      p_subcategory_slug: classification.status === "auto" ? classification.subcategorySlug : null,
      p_leaf_slug: classification.status === "auto" ? classification.leafSlug : null,
      p_classification_source: classification.source,
      p_classification_confidence: classification.confidence,
      p_classification_review_status: classification.status,
      p_suggested_department_slug: classification.suggestedDepartmentSlug,
      p_suggested_subcategory_slug: classification.suggestedSubcategorySlug,
      p_suggested_leaf_slug: classification.suggestedLeafSlug,
      p_classification_reasons: [...classification.reasons],
    });

    if (error !== null || !Array.isArray(data) || data.length !== 1) {
      throw new AffiliateProductAdminRepositoryError("Supabase ingestion upsert failed.", { cause: error });
    }

    return asIngestionResult(data[0]);
  }

  async listReviews(limit: number, cursorValue: string | null): Promise<AffiliateReviewPage> {
    const cursor = cursorValue === null ? null : decodeAffiliateReviewCursor(cursorValue);
    if (cursorValue !== null && cursor === null) {
      throw new AffiliateProductAdminRepositoryError("Invalid review cursor.");
    }

    let query = createServerSupabaseClient()
      .from("products")
      .select(REVIEW_SELECT)
      .eq("is_active", true)
      .eq("classification_review_status", "review")
      .order("classification_updated_at", { ascending: true })
      .order("id", { ascending: true })
      .limit(limit + 1);

    if (cursor !== null) {
      query = query.or(
        `classification_updated_at.gt.${cursor.updatedAt},and(classification_updated_at.eq.${cursor.updatedAt},id.gt.${cursor.id})`,
      );
    }

    const { data, error } = await query;
    if (error !== null || !Array.isArray(data)) {
      throw new AffiliateProductAdminRepositoryError("Supabase review listing failed.", { cause: error });
    }

    const rows = data.map(asReviewProduct);
    const pageRows = rows.slice(0, limit);
    const hasNextPage = rows.length > limit;
    const last = pageRows[pageRows.length - 1];
    return {
      items: pageRows,
      nextCursor:
        hasNextPage && last !== undefined
          ? encodeAffiliateReviewCursor({ updatedAt: last.classificationUpdatedAt, id: last.id })
          : null,
    };
  }

  async getState(productId: string): Promise<AdminProductState | null> {
    const { data, error } = await createServerSupabaseClient()
      .from("products")
      .select("id,is_active,classification_review_status,classification_source,department_slug,leaf_slug,classification_revision,classification_last_operation_id,classification_last_operation_kind")
      .eq("id", productId)
      .maybeSingle();

    if (error !== null) throw new AffiliateProductAdminRepositoryError("Supabase state lookup failed.", { cause: error });
    if (data === null) return null;

    const row = data as Record<string, unknown>;
    const stateRevision = row.classification_revision;
    const lastOperationId = row.classification_last_operation_id ?? null;
    const lastOperationKind = row.classification_last_operation_kind ?? null;
    if (
      !isSupportedUuid(row.id) ||
      typeof row.is_active !== "boolean" ||
      typeof stateRevision !== "number" ||
      !Number.isSafeInteger(stateRevision) ||
      stateRevision < 0 ||
      (row.classification_review_status !== null && row.classification_review_status !== "auto" && row.classification_review_status !== "review") ||
      (row.classification_source !== null && typeof row.classification_source !== "string") ||
      (row.department_slug !== null && !isDepartmentSlug(row.department_slug)) ||
      (row.leaf_slug !== null && !isLeafSlug(row.leaf_slug)) ||
      (row.leaf_slug !== null && !isDepartmentLeafPair(row.department_slug, row.leaf_slug)) ||
      (row.leaf_slug === null && row.department_slug !== null) ||
      (lastOperationId !== null && !isSupportedUuid(lastOperationId)) ||
      (lastOperationId !== null && typeof lastOperationId !== "string") ||
      ((lastOperationId === null) !== (lastOperationKind === null)) ||
      (lastOperationKind !== null &&
        lastOperationKind !== "approve" &&
        lastOperationKind !== "deactivate") ||
      (lastOperationKind !== null && typeof lastOperationKind !== "string")
    ) {
      throw new AffiliateProductAdminRepositoryError("Supabase returned an invalid product state.");
    }

    return {
      id: row.id,
      isActive: row.is_active,
      classificationReviewStatus: row.classification_review_status,
      classificationSource: row.classification_source,
      leafSlug: row.leaf_slug,
      classificationRevision: stateRevision,
      classificationLastOperationId: lastOperationId as string | null,
      classificationLastOperationKind: lastOperationKind as "approve" | "deactivate" | null,
    };
  }

  async approve(
    productId: string,
    departmentSlug: DepartmentSlug,
    subcategorySlug: SubcategorySlug | null,
    leafSlug: LeafSlug,
    expectedRevision: number,
    operationId: string,
  ): Promise<AffiliateReviewMutationResponse | null> {
    const { data, error } = await createServerSupabaseClient().rpc("approve_affiliate_product_classification", {
      p_product_id: productId,
      p_department_slug: departmentSlug,
      p_subcategory_slug: subcategorySlug,
      p_leaf_slug: leafSlug,
      p_expected_revision: expectedRevision,
      p_operation_id: operationId,
    });

    if (error !== null) throw new AffiliateProductAdminRepositoryError("Supabase approval failed.", { cause: error });
    if (!Array.isArray(data) || data.length === 0) return null;
    const result = asMutationResult(data[0]);
    return {
      id: result.id,
      classificationRevision: result.classification_revision,
      publicEligible: result.public_eligible,
    };
  }

  async deactivate(productId: string, expectedRevision: number, operationId: string): Promise<AffiliateReviewMutationResponse | null> {
    const { data, error } = await createServerSupabaseClient().rpc("deactivate_affiliate_product", {
      p_product_id: productId,
      p_expected_revision: expectedRevision,
      p_operation_id: operationId,
    });

    if (error !== null) throw new AffiliateProductAdminRepositoryError("Supabase deactivation failed.", { cause: error });
    if (!Array.isArray(data) || data.length === 0) return null;
    const result = asMutationResult(data[0]);
    return {
      id: result.id,
      classificationRevision: result.classification_revision,
      publicEligible: result.public_eligible,
    };
  }
}
