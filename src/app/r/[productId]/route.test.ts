import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/server", async () => {
  const actual = await vi.importActual<typeof import("next/server")>("next/server");
  return {
    ...actual,
    after: vi.fn(async (callback: () => Promise<void>) => callback()),
  };
});
vi.mock("@/entities/affiliate-product/index.server", () => ({
  getPublicAffiliateProductById: vi.fn(),
  isAffiliateProductId: vi.fn((value: string) => value === "550e8400-e29b-41d4-a716-446655440000"),
}));
vi.mock("@/entities/affiliate-product", () => ({
  isAllowedAffiliateDestination: vi.fn(),
}));
vi.mock("@/shared/api/supabase/index.server", () => ({
  createTrackingSupabaseClient: vi.fn(),
}));

import { NextRequest } from "next/server";

import { isAllowedAffiliateDestination } from "@/entities/affiliate-product";
import {
  getPublicAffiliateProductById,
} from "@/entities/affiliate-product/index.server";
import { createTrackingSupabaseClient } from "@/shared/api/supabase/index.server";

import { GET } from "./route";

const product = {
  id: "550e8400-e29b-41d4-a716-446655440000",
  productIdShopee: "123.456",
  slug: "shopee-123-456",
  title: "Fone Bluetooth",
  priceOriginal: 129.9,
  priceDiscount: 99.9,
  imageUrl: "https://cdn.example.com/fone.jpg",
  affiliateUrl: "https://shopee.com.br/product/123",
  category: "Eletronicos",
  isActive: true,
  createdAt: "2026-08-12T00:00:00.000Z",
  departmentSlug: "tech",
  subcategorySlug: "audio",
  leafSlug: "audio",
  classificationSource: "legacy-backfill-v1",
  classificationConfidence: 0.96,
  classificationReviewStatus: "auto",
  marketplace: "shopee",
  priceOriginalCents: 12990,
  priceDiscountCents: 9990,
} as const;

function request(): NextRequest {
  return new NextRequest("https://ofertas.salvatbrand.com.br/r/550e8400-e29b-41d4-a716-446655440000", {
    headers: {
      "user-agent": "Mozilla/5.0",
      referer: "https://ofertas.salvatbrand.com.br/folha/audio",
    },
  });
}

describe("affiliate product redirect", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getPublicAffiliateProductById).mockResolvedValue(product);
    vi.mocked(isAllowedAffiliateDestination).mockReturnValue(true);
  });

  it("redirects with no-store and records only the tracking click", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: null, error: null });
    vi.mocked(createTrackingSupabaseClient).mockReturnValue({ rpc } as never);

    const response = await GET(request(), {
      params: Promise.resolve({ productId: product.id }),
    });

    expect(response.status).toBe(302);
    expect(response.headers.get("location")).toBe(product.affiliateUrl);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(rpc).toHaveBeenCalledWith("record_click", expect.objectContaining({
      p_source: "vitrine",
      p_tracking_code: product.id,
      p_product_id: product.productIdShopee,
    }));
  });

  it("keeps the redirect working when tracking fails", async () => {
    const rpc = vi.fn().mockRejectedValue(new Error("tracking unavailable"));
    vi.mocked(createTrackingSupabaseClient).mockReturnValue({ rpc } as never);

    const response = await GET(request(), {
      params: Promise.resolve({ productId: product.id }),
    });

    expect(response.status).toBe(302);
    expect(response.headers.get("location")).toBe(product.affiliateUrl);
  });

  it("uses a safe fallback when the product is not public", async () => {
    vi.mocked(getPublicAffiliateProductById).mockResolvedValue(null);

    const response = await GET(request(), {
      params: Promise.resolve({ productId: product.id }),
    });

    expect(response.status).toBe(302);
    expect(response.headers.get("location")).toBe("https://shopee.com.br/");
    expect(createTrackingSupabaseClient).not.toHaveBeenCalled();
  });
});
