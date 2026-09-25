import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("./list-public-affiliate-product-page", () => ({
  listPublicAffiliateProductPage: vi.fn(),
}));

import { listPublicAffiliateProductPage } from "./list-public-affiliate-product-page";
import { listRelatedPublicAffiliateProducts } from "./list-related-public-affiliate-products";

function card(id: string) {
  return {
    id,
    title: id,
    imageUrl: "https://cdn.example.com/p.jpg",
    priceOriginalCents: 1000,
    priceDiscountCents: 800,
    marketplace: "shopee" as const,
    leafSlug: "decoracao" as const,
  };
}

describe("related public affiliate products", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns up to five siblings and excludes the current product", async () => {
    vi.mocked(listPublicAffiliateProductPage).mockResolvedValue({
      items: [card("a"), card("current"), card("b"), card("c"), card("d"), card("e")],
      hasNextPage: false,
      nextCursor: null,
    });

    const result = await listRelatedPublicAffiliateProducts({
      departmentSlug: "casa",
      leafSlug: "decoracao",
      excludeProductId: "current",
    });

    expect(listPublicAffiliateProductPage).toHaveBeenCalledWith({
      departmentSlug: "casa",
      leafSlug: "decoracao",
      pageSize: 6,
    });
    expect(result.map((product) => product.id)).toEqual(["a", "b", "c", "d", "e"]);
  });
});
