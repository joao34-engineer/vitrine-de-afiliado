import "server-only";

import { cacheLife, cacheTag } from "next/cache";
import { createPublicSupabaseClient } from "@/shared/api/supabase";

import { mapSupabasePublicAffiliateProductDetailRow } from "../model/affiliate-product-mapper";
import type { PublicAffiliateProduct } from "../model/affiliate-product";
import { isSupabasePublicAffiliateProductDetailRow } from "../model/public-affiliate-product-row";
import { PublicAffiliateProductCatalogError } from "../model/public-affiliate-product-catalog-error";
import { isSupportedUuid } from "../model/public-product-validation";

export function isAffiliateProductId(value: unknown): value is string {
  return isSupportedUuid(value);
}

export async function getPublicAffiliateProductById(
  productId: string,
): Promise<PublicAffiliateProduct | null> {
  if (!isAffiliateProductId(productId)) {
    throw new PublicAffiliateProductCatalogError(
      "invalid-filter",
      "Invalid public affiliate product id.",
    );
  }

  const { data, error } = await createPublicSupabaseClient().rpc(
    "get_public_affiliate_product",
    { p_product_id: productId.trim() },
  );

  if (error) {
    throw new PublicAffiliateProductCatalogError(
      "query-failed",
      "Failed to load public affiliate product.",
      { cause: error },
    );
  }

  if (!Array.isArray(data)) {
    throw new PublicAffiliateProductCatalogError(
      "invalid-response",
      "Supabase returned an invalid public affiliate product response.",
    );
  }

  if (data.length === 0) {
    return null;
  }

  if (data.length !== 1 || typeof data[0] !== "object" || data[0] === null) {
    throw new PublicAffiliateProductCatalogError(
      "invalid-response",
      "Supabase returned an invalid public affiliate product.",
    );
  }

  const row = data[0] as Record<string, unknown>;
  const requiredFields = [
    "id",
    "product_id_shopee",
    "title",
    "price_original",
    "price_discount",
    "image_url",
    "shopee_affiliate_link",
    "category",
    "is_active",
    "created_at",
    "department_slug",
    "subcategory_slug",
    "leaf_slug",
  ];
  if (requiredFields.some((field) => !(field in row))) {
    throw new PublicAffiliateProductCatalogError(
      "invalid-response",
      "Supabase returned an incomplete public affiliate product.",
    );
  }

  if (!isSupabasePublicAffiliateProductDetailRow(data[0])) {
    return null;
  }

  return mapSupabasePublicAffiliateProductDetailRow(data[0]);
}

export async function getCachedPublicAffiliateProductById(
  productId: string,
): Promise<PublicAffiliateProduct | null> {
  if (!isAffiliateProductId(productId)) {
    throw new PublicAffiliateProductCatalogError("invalid-filter", "Invalid public affiliate product id.");
  }
  return getCachedPublicAffiliateProductByIdInternal(productId.trim());
}

async function getCachedPublicAffiliateProductByIdInternal(
  productId: string,
): Promise<PublicAffiliateProduct | null> {
  "use cache";
  cacheLife("affiliateCatalog");
  cacheTag("affiliate-catalog", `affiliate-catalog:product:${productId}`);
  return getPublicAffiliateProductById(productId);
}
