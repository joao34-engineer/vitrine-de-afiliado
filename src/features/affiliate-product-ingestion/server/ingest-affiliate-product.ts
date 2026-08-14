import "server-only";

import { revalidateTag } from "next/cache";

import {
  AffiliateProductAdminRepository,
  type AffiliateProductAdminRepositoryError,
} from "@/entities/affiliate-product/api/admin-affiliate-product-repository";
import {
  classifyAffiliateProductForIngestion,
  type AffiliateIngestionClassification,
} from "@/entities/affiliate-product";
import {
  affiliateProductIngestionRequestSchema,
  type AffiliateProductIngestionRequest,
  type AffiliateProductIngestionResponse,
} from "@/entities/affiliate-product/model/affiliate-ingestion";

export class AffiliateProductIngestionError extends Error {
  readonly code = "affiliate_product_ingestion_error" as const;

  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = "AffiliateProductIngestionError";
  }
}

export class AffiliateProductCacheInvalidationError extends Error {
  readonly code = "affiliate_product_cache_invalidation_error" as const;

  constructor(options?: { cause?: unknown }) {
    super("Product was stored but public catalog cache invalidation failed.", options);
    this.name = "AffiliateProductCacheInvalidationError";
  }
}

type IngestionDependencies = {
  readonly repository: Pick<AffiliateProductAdminRepository, "upsertIngestion">;
  readonly revalidateCatalog: () => void;
};

const defaultDependencies: IngestionDependencies = {
  repository: new AffiliateProductAdminRepository(),
  revalidateCatalog: () => revalidateTag("affiliate-catalog", "max"),
};

export function classifyAffiliateIngestionInput(
  product: AffiliateProductIngestionRequest,
): AffiliateIngestionClassification {
  return classifyAffiliateProductForIngestion({
    title: product.title,
    aiCopy: product.aiCopy,
    legacyCategory: product.legacyCategory,
  });
}

export async function ingestAffiliateProduct(
  input: unknown,
  dependencies: IngestionDependencies = defaultDependencies,
): Promise<AffiliateProductIngestionResponse> {
  const parsed = affiliateProductIngestionRequestSchema.safeParse(input);
  if (!parsed.success) {
    throw new AffiliateProductIngestionError("Invalid affiliate product ingestion payload.", { cause: parsed.error });
  }

  const product = parsed.data;
  const classification = classifyAffiliateIngestionInput(product);
  const result = await dependencies.repository.upsertIngestion(product, classification);
  const disposition = result.public_eligible
    ? "published"
    : result.classification_review_status === "review"
      ? "review"
      : "inactive";

  if (result.public_eligible || result.previous_public_eligible) {
    try {
      dependencies.revalidateCatalog();
    } catch (error) {
      throw new AffiliateProductCacheInvalidationError({ cause: error });
    }
  }

  return {
    id: result.id,
    productIdShopee: result.product_id_shopee,
    disposition,
    classificationRevision: result.classification_revision,
    changed: result.changed,
    created: result.created,
    publicEligible: result.public_eligible,
  };
}

export function isAffiliateProductAdminRepositoryError(
  error: unknown,
): error is AffiliateProductAdminRepositoryError {
  return error instanceof Error && error.name === "AffiliateProductAdminRepositoryError";
}
