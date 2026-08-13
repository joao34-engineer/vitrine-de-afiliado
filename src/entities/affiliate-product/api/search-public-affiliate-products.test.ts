import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ cacheLife: vi.fn(), cacheTag: vi.fn() }));
vi.mock("@/shared/api/supabase", () => ({ createPublicSupabaseClient: vi.fn() }));

import { createPublicSupabaseClient, type AffiliateVitrineSupabaseClient } from "@/shared/api/supabase";
import type { SupabaseSearchProductRow } from "@/types/supabase";

import { searchPublicAffiliateProducts } from "./search-public-affiliate-products";

function row(overrides: Partial<SupabaseSearchProductRow> = {}): SupabaseSearchProductRow {
  return {
    id: "550e8400-e29b-41d4-a716-446655440000",
    product_id_shopee: "123.456",
    title: "Fone Bluetooth",
    price_original: 129.9,
    price_discount: 99.9,
    image_url: "https://cdn.example.com/fone.jpg",
    category: "Eletronicos",
    is_active: true,
    created_at: "2026-08-12T00:00:00.000Z",
    department_slug: "tech",
    subcategory_slug: "audio",
    leaf_slug: "audio",
    classification_source: "legacy-backfill-v1",
    classification_confidence: 0.96,
    classification_review_status: "auto",
    relevance_rank: 0.82,
    ...overrides,
  };
}

function setClient(data: unknown, error: Error | null = null) {
  const rpc = vi.fn().mockResolvedValue({ data, error });
  const client = { rpc } as unknown as AffiliateVitrineSupabaseClient;
  vi.mocked(createPublicSupabaseClient).mockReturnValue(client);
  return rpc;
}

describe("public affiliate product search", () => {
  beforeEach(() => vi.clearAllMocks());

  it("uses the public RPC and returns no ai_copy to the caller", async () => {
    const rpc = setClient([row()]);
    const result = await searchPublicAffiliateProducts({ query: "fone bluetooth" });
    expect(rpc).toHaveBeenCalledWith("search_public_affiliate_products", expect.objectContaining({ p_query: "fone bluetooth", p_limit: 25 }));
    expect(result.items[0]).not.toHaveProperty("ai_copy");
    expect(result.items[0]?.title).toBe("Fone Bluetooth");
  });

  it("rejects invalid search before creating the client", async () => {
    await expect(searchPublicAffiliateProducts({ query: "x" })).rejects.toMatchObject({ code: "invalid-filter" });
    expect(createPublicSupabaseClient).not.toHaveBeenCalled();
  });

  it("propagates RPC failures", async () => {
    setClient(null, new Error("rpc down"));
    await expect(searchPublicAffiliateProducts({ query: "fone" })).rejects.toMatchObject({ code: "query-failed" });
  });
});
