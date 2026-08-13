import "server-only";

import { cacheLife, cacheTag } from "next/cache";
import { createPublicSupabaseClient } from "@/shared/api/supabase";

import { isPublicAffiliateProduct } from "../model/affiliate-product";
import { mapSupabaseProductRowToPublicAffiliateProduct } from "../model/affiliate-product-mapper";
import type { PublicAffiliateProduct } from "../model/affiliate-product";
import { isSupabasePublicAffiliateProductDetailRow } from "../model/public-affiliate-product-row";
import { PublicAffiliateProductCatalogError } from "../model/public-affiliate-product-catalog-error";

export function isAffiliateProductId(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value.trim())
  );
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

  if (data.length !== 1 || !isSupabasePublicAffiliateProductDetailRow(data[0])) {
    throw new PublicAffiliateProductCatalogError(
      "invalid-response",
      "Supabase returned an invalid public affiliate product.",
    );
  }

  const product = mapSupabaseProductRowToPublicAffiliateProduct(data[0]);
  return product !== null && isPublicAffiliateProduct(product) ? product : null;
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
