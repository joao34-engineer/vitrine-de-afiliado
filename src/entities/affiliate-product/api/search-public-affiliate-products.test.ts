import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ cacheLife: vi.fn(), cacheTag: vi.fn() }));
vi.mock("@/shared/api/supabase", () => ({ createPublicSupabaseClient: vi.fn() }));

import { createPublicSupabaseClient, type AffiliateVitrineSupabaseClient } from "@/shared/api/supabase";
import type { SupabaseSearchProductRow } from "@/types/supabase";

import {
  searchPublicAffiliateProductWindow,
  searchPublicAffiliateProducts,
} from "./search-public-affiliate-products";
import { PUBLIC_AFFILIATE_CATALOG_MAX_QUERY_LIMIT } from "../model/affiliate-catalog-pagination";
import { encodePublicAffiliateSearchCursor } from "../model/affiliate-search";

function row(overrides: Partial<SupabaseSearchProductRow> = {}): SupabaseSearchProductRow {
  return {
    id: "550e8400-e29b-41d4-a716-446655440000",
    product_id_shopee: "123.456",
    title: "Fone Bluetooth",
    price_original: 129.9,
    price_discount: 99.9,
    image_url: "https://cf.shopee.com.br/file/fone.jpg",
    category: "Eletronicos",
    is_active: true,
    created_at: "2026-08-12T00:00:00.000Z",
    department_slug: "tech",
    subcategory_slug: "audio",
    leaf_slug: "audio",
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
    expect(result.items[0]).not.toHaveProperty("classificationReviewStatus");
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

  it("passes taxonomy filters and a validated ranking cursor to the RPC", async () => {
    const rpc = setClient([row({ relevance_rank: 0.4 })]);
    const cursor = encodePublicAffiliateSearchCursor({
      rank: 0.8,
      createdAt: "2026-08-13T00:00:00.000Z",
      id: "550e8400-e29b-41d4-a716-446655440000",
    });

    await searchPublicAffiliateProducts({
      query: "fone",
      departmentSlug: "tech",
      leafSlug: "audio",
      cursor,
    });

    expect(rpc).toHaveBeenCalledWith("search_public_affiliate_products", expect.objectContaining({
      p_department_slug: "tech",
      p_leaf_slug: "audio",
      p_cursor_rank: 0.8,
      p_cursor_created_at: "2026-08-13T00:00:00.000Z",
    }));
  });

  it("accepts a modern UUID v7 in a ranking cursor", async () => {
    const rpc = setClient([row({
      id: "018f47bf-8f47-7f32-995e-db19a8753c81",
      relevance_rank: 0.4,
    })]);
    const cursor = encodePublicAffiliateSearchCursor({
      rank: 0.8,
      createdAt: "2026-08-13T00:00:00.000Z",
      id: "018f47bf-8f47-7f32-995e-db19a8753c81",
    });

    await searchPublicAffiliateProducts({ query: "fone", cursor });

    expect(rpc).toHaveBeenCalledWith("search_public_affiliate_products", expect.objectContaining({
      p_cursor_id: "018f47bf-8f47-7f32-995e-db19a8753c81",
    }));
  });

  it("rejects invalid pairs, cursors and malformed responses before exposing products", async () => {
    await expect(searchPublicAffiliateProducts({ query: "fone", departmentSlug: "tech", leafSlug: "roupas" as never })).rejects.toMatchObject({ code: "invalid-filter" });
    expect(createPublicSupabaseClient).not.toHaveBeenCalled();

    await expect(searchPublicAffiliateProducts({ query: "fone", cursor: "invalid" })).rejects.toMatchObject({ code: "invalid-filter" });

    setClient("not-an-array");
    await expect(searchPublicAffiliateProducts({ query: "fone" })).rejects.toMatchObject({ code: "invalid-response" });
  });

  it("rejects a search page containing only invalid public rows", async () => {
    setClient([row({ is_active: false })]);
    await expect(searchPublicAffiliateProducts({ query: "fone" })).rejects.toMatchObject({ code: "invalid-response" });
  });

  it("rejects a search row with an invalid created_at before cursoring", async () => {
    setClient([row({ created_at: "not-a-date" })]);
    await expect(searchPublicAffiliateProducts({ query: "fone" })).rejects.toMatchObject({ code: "invalid-response" });
  });

  it("uses one bounded RPC call for a ten-page search window", async () => {
    const rows = Array.from({ length: PUBLIC_AFFILIATE_CATALOG_MAX_QUERY_LIMIT }, (_, index) =>
      row({
        id: `550e8400-e29b-41d4-a716-44665544${String(index).padStart(4, "0")}`,
        relevance_rank: 1 - index / 10000,
        created_at: `2026-08-${String(12 - Math.floor(index / 24)).padStart(2, "0")}T00:00:00.000Z`,
      }),
    );
    const rpc = setClient(rows);

    const result = await searchPublicAffiliateProductWindow({ query: "fone", pageNumber: 10 });

    expect(result.items).toHaveLength(240);
    expect(result.hasNextPage).toBe(true);
    expect(rpc).toHaveBeenCalledWith("search_public_affiliate_products", expect.objectContaining({
      p_limit: PUBLIC_AFFILIATE_CATALOG_MAX_QUERY_LIMIT,
    }));
  });
});
