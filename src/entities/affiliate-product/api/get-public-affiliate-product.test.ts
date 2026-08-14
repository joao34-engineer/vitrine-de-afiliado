import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ cacheLife: vi.fn(), cacheTag: vi.fn() }));
vi.mock("@/shared/api/supabase", () => ({ createPublicSupabaseClient: vi.fn() }));

import { createPublicSupabaseClient, type AffiliateVitrineSupabaseClient } from "@/shared/api/supabase";
import type { SupabasePublicAffiliateProductDetailRow } from "@/types/supabase";

import { getPublicAffiliateProductById, isAffiliateProductId } from "./get-public-affiliate-product";

const productId = "550e8400-e29b-41d4-a716-446655440000";

function row(overrides: Partial<SupabasePublicAffiliateProductDetailRow> = {}): SupabasePublicAffiliateProductDetailRow {
  return {
    id: productId,
    product_id_shopee: "123.456",
    title: "Fone Bluetooth",
    price_original: 129.9,
    price_discount: 99.9,
    image_url: "https://cf.shopee.com.br/file/fone.jpg",
    shopee_affiliate_link: "https://shopee.com.br/product/123",
    category: "Eletronicos",
    is_active: true,
    created_at: "2026-08-12T00:00:00.000Z",
    department_slug: "tech",
    subcategory_slug: "audio",
    leaf_slug: "audio",
    ...overrides,
  };
}

function setRpc(data: unknown, error: Error | null = null) {
  const rpc = vi.fn().mockResolvedValue({ data, error });
  vi.mocked(createPublicSupabaseClient).mockReturnValue({ rpc } as unknown as AffiliateVitrineSupabaseClient);
  return rpc;
}

describe("public affiliate product detail", () => {
  beforeEach(() => vi.clearAllMocks());

  it("accepts modern PostgreSQL UUID versions", () => {
    expect(isAffiliateProductId("018f47bf-8f47-7f32-995e-db19a8753c81")).toBe(true);
    expect(isAffiliateProductId("550e8400-e29b-41d4-a716-446655440000")).toBe(true);
  });

  it("rejects an invalid UUID before creating the client", async () => {
    await expect(getPublicAffiliateProductById("invalid")).rejects.toMatchObject({ code: "invalid-filter" });
    expect(createPublicSupabaseClient).not.toHaveBeenCalled();
  });

  it("maps one public detail row and keeps the affiliate URL out of list DTOs", async () => {
    const rpc = setRpc([row()]);
    const result = await getPublicAffiliateProductById(productId);
    expect(rpc).toHaveBeenCalledWith("get_public_affiliate_product", { p_product_id: productId });
    expect(result?.affiliateUrl).toBe("https://shopee.com.br/product/123");
    expect(result).not.toHaveProperty("classificationReviewStatus");
    expect(result).not.toHaveProperty("classificationConfidence");
  });

  it("returns null for an absent or non-public product", async () => {
    setRpc([]);
    await expect(getPublicAffiliateProductById(productId)).resolves.toBeNull();

    setRpc([row({ is_active: false })]);
    await expect(getPublicAffiliateProductById(productId)).resolves.toBeNull();
  });

  it("rejects malformed rows and propagates RPC errors", async () => {
    setRpc([row({ shopee_affiliate_link: "javascript:alert(1)" })]);
    await expect(getPublicAffiliateProductById(productId)).resolves.toBeNull();

    setRpc([row({ shopee_affiliate_link: "https://evil.example/product/123" })]);
    await expect(getPublicAffiliateProductById(productId)).resolves.toBeNull();

    setRpc(null, new Error("rpc unavailable"));
    await expect(getPublicAffiliateProductById(productId)).rejects.toMatchObject({ code: "query-failed" });
  });
});
