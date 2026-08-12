import { describe, expect, it } from "vitest";

import { isPublishableAffiliateProduct, type PublishableAffiliateProduct } from "..";

const baseProduct = {
  id: "product-1",
  slug: "fone-bluetooth",
  title: "Fone bluetooth",
  imageUrl: "https://example.com/fone.jpg",
  affiliateUrl: "https://example.com/oferta",
  marketplace: "shopee",
  category: "Categoria legada livre",
  isActive: true,
  priceOriginalCents: 12990,
  priceDiscountCents: 9990,
  departmentSlug: "tech",
  subcategorySlug: "audio",
  leafSlug: "audio",
  classificationSource: "legacy-backfill-v1",
  classificationConfidence: 0.92,
  classificationReviewStatus: "auto",
} satisfies PublishableAffiliateProduct;

describe("affiliate product contract", () => {
  it("accepts a publishable product using department and leaf as navigation contract", () => {
    expect(isPublishableAffiliateProduct(baseProduct)).toBe(true);
  });

  it("does not depend on legacy category for navigation", () => {
    const productWithDifferentCategory = {
      ...baseProduct,
      category: "Valor legado que nao dirige navegacao",
    } satisfies PublishableAffiliateProduct;

    expect(isPublishableAffiliateProduct(productWithDifferentCategory)).toBe(true);
  });

  it("rejects a product with mismatched department and leaf", () => {
    expect(
      isPublishableAffiliateProduct({
        ...baseProduct,
        departmentSlug: "casa",
      }),
    ).toBe(false);
  });

  it("rejects inactive products even when taxonomy is valid", () => {
    expect(
      isPublishableAffiliateProduct({
        ...baseProduct,
        isActive: false,
      }),
    ).toBe(false);
  });
});
