import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("./list-public-affiliate-product-page", () => ({
  listPublicAffiliateProductWindow: vi.fn(),
}));

import { listPublicAffiliateProductWindow } from "./list-public-affiliate-product-page";
import { listPublicAffiliateProductPages } from "./list-public-affiliate-product-pages";

const item = {
  id: "550e8400-e29b-41d4-a716-446655440000",
  title: "Fone Bluetooth",
  imageUrl: "https://cdn.example.com/fone.jpg",
  priceOriginalCents: 12990,
  priceDiscountCents: 9990,
  marketplace: "shopee" as const,
  leafSlug: "audio" as const,
};

describe("progressive public catalog pages", () => {
  beforeEach(() => vi.clearAllMocks());

  it("uses one bounded server query for a ten-page window", async () => {
    vi.mocked(listPublicAffiliateProductWindow).mockResolvedValue({
      items: [item],
      hasNextPage: true,
      nextCursor: "cursor-10",
      pageNumber: 10,
      startingCursor: null,
    });

    const result = await listPublicAffiliateProductPages({ pageNumber: 10 });

    expect(result.items).toHaveLength(1);
    expect(listPublicAffiliateProductWindow).toHaveBeenCalledTimes(1);
    expect(result.hasNextPage).toBe(true);
    expect(result.nextCursor).toBe("cursor-10");
  });

  it("rejects a page number above the progressive limit before querying", async () => {
    await expect(listPublicAffiliateProductPages({ pageNumber: 11 })).rejects.toMatchObject({ code: "invalid-filter" });
    expect(listPublicAffiliateProductWindow).not.toHaveBeenCalled();
  });
});
