import { describe, expect, it } from "vitest";

import {
  deriveAffiliateProductSlug,
  mapSupabaseProductRowToPublishableAffiliateProduct,
  mapSupabaseProductRowToPublicAffiliateProduct,
} from "..";
import type { SupabaseProductRow } from "@/types/supabase";

function row(overrides: Partial<SupabaseProductRow> = {}): SupabaseProductRow {
  return {
    id: "550e8400-e29b-41d4-a716-446655440000",
    product_id_shopee: "123.456",
    title: "Fone Bluetooth",
    price_original: 129.9,
    price_discount: 99.9,
    image_url: "https://cf.shopee.com.br/file/fone.jpg",
    shopee_affiliate_link: "https://shopee.com.br/product/123",
    ai_copy: null,
    category: "Eletronicos",
    sales: null,
    embedding: null,
    is_active: true,
    created_at: "2026-08-12T00:00:00.000Z",
    department_slug: "tech",
    subcategory_slug: "audio",
    leaf_slug: "audio",
    classification_source: "legacy-backfill-v1",
    classification_confidence: 0.96,
    classification_review_status: "auto",
    search_document: null,
    ...overrides,
  };
}

describe("Supabase product mapper", () => {
  it("derives a stable Shopee slug from the external product id", () => {
    expect(deriveAffiliateProductSlug(row())).toBe("shopee-123-456");
  });

  it("maps legacy prices from reais to cents and preserves taxonomy", () => {
    const product = mapSupabaseProductRowToPublicAffiliateProduct(row());

    expect(product).toMatchObject({
      id: "550e8400-e29b-41d4-a716-446655440000",
      slug: "shopee-123-456",
      marketplace: "shopee",
      affiliateUrl: "https://shopee.com.br/product/123",
      priceOriginalCents: 12990,
      priceDiscountCents: 9990,
      departmentSlug: "tech",
      subcategorySlug: "audio",
      leafSlug: "audio",
    });
  });

  it("keeps review products out of the public mapper", () => {
    const reviewRow = row({ classification_review_status: "review" });

    expect(mapSupabaseProductRowToPublishableAffiliateProduct(reviewRow)).not.toBeNull();
    expect(mapSupabaseProductRowToPublicAffiliateProduct(reviewRow)).toBeNull();
  });

  it("rejects inactive, invalid-taxonomy and invalid-url rows", () => {
    expect(mapSupabaseProductRowToPublicAffiliateProduct(row({ is_active: false }))).toBeNull();
    expect(
      mapSupabaseProductRowToPublicAffiliateProduct(
        row({ department_slug: "casa", leaf_slug: "audio" }),
      ),
    ).toBeNull();
    expect(
      mapSupabaseProductRowToPublicAffiliateProduct(
        row({ shopee_affiliate_link: "not-a-url" }),
      ),
    ).toBeNull();
  });

  it("rejects invalid public image hosts and negative prices", () => {
    expect(
      mapSupabaseProductRowToPublicAffiliateProduct(
        row({ image_url: "https://cdn.example.com/fone.jpg" }),
      ),
    ).toBeNull();
    expect(
      mapSupabaseProductRowToPublicAffiliateProduct(
        row({ price_discount: -1 }),
      ),
    ).toBeNull();
  });

  it("rejects rows without a valid catalog timestamp", () => {
    expect(
      mapSupabaseProductRowToPublicAffiliateProduct(
        row({ created_at: "not-a-date" }),
      ),
    ).toBeNull();
  });
});
