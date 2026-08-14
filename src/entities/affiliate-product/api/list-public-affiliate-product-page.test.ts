import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ cacheLife: vi.fn(), cacheTag: vi.fn() }));
vi.mock("@/shared/api/supabase", () => ({ createPublicSupabaseClient: vi.fn() }));

import { createPublicSupabaseClient, type AffiliateVitrineSupabaseClient } from "@/shared/api/supabase";
import { cacheLife, cacheTag } from "next/cache";
import type { SupabasePublicProductRow } from "@/types/supabase";

import {
  encodePublicAffiliateProductCursor,
  PUBLIC_AFFILIATE_CATALOG_MAX_QUERY_LIMIT,
  PUBLIC_AFFILIATE_CATALOG_PAGE_SIZE,
} from "../model/affiliate-catalog-pagination";
import {
  listPublicAffiliateProductPage,
  listPublicAffiliateProductWindow,
} from "./list-public-affiliate-product-page";

function row(overrides: Partial<SupabasePublicProductRow> = {}): SupabasePublicProductRow {
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
    ...overrides,
  };
}

function setClient(data: unknown, error: Error | null = null) {
  const rpc = vi.fn().mockResolvedValue({ data, error });
  vi.mocked(createPublicSupabaseClient).mockReturnValue({ rpc } as unknown as AffiliateVitrineSupabaseClient);
  return rpc;
}

describe("public affiliate product page", () => {
  beforeEach(() => vi.clearAllMocks());

  it("uses the public list RPC with an explicit bounded contract", async () => {
    const rpc = setClient([row()]);
    const result = await listPublicAffiliateProductPage();

    expect(result.items).toHaveLength(1);
    expect(result.items[0]).not.toHaveProperty("classificationReviewStatus");
    expect(result.items[0]).not.toHaveProperty("affiliateUrl");
    expect(rpc).toHaveBeenCalledWith("list_public_affiliate_products", {
      p_department_slug: null,
      p_leaf_slug: null,
      p_limit: PUBLIC_AFFILIATE_CATALOG_PAGE_SIZE + 1,
      p_cursor_created_at: null,
      p_cursor_id: null,
    });
    expect(cacheLife).toHaveBeenCalledWith("affiliateCatalog");
    expect(cacheTag).toHaveBeenCalledWith("affiliate-catalog");
  });

  it("applies department and leaf filters through the RPC", async () => {
    const rpc = setClient([row()]);
    await listPublicAffiliateProductPage({ departmentSlug: "tech", leafSlug: "audio" });

    expect(rpc).toHaveBeenCalledWith("list_public_affiliate_products", expect.objectContaining({
      p_department_slug: "tech",
      p_leaf_slug: "audio",
    }));
  });

  it("rejects an invalid pair before creating the public client", async () => {
    await expect(listPublicAffiliateProductPage({ departmentSlug: "tech", leafSlug: "roupas" as never })).rejects.toMatchObject({ code: "invalid-filter" });
    expect(createPublicSupabaseClient).not.toHaveBeenCalled();
  });

  it("encodes the next keyset cursor from the last returned row", async () => {
    const rows = Array.from({ length: PUBLIC_AFFILIATE_CATALOG_PAGE_SIZE + 1 }, (_, index) =>
      row({
        id: `550e8400-e29b-41d4-a716-44665544${String(index).padStart(4, "0")}`,
        created_at: `2026-08-${String(12 - Math.floor(index / 24)).padStart(2, "0")}T00:00:00.000Z`,
      }),
    );
    const rpc = setClient(rows);

    const result = await listPublicAffiliateProductPage();
    expect(result.hasNextPage).toBe(true);
    expect(result.nextCursor).toBe(encodePublicAffiliateProductCursor({
      createdAt: rows[PUBLIC_AFFILIATE_CATALOG_PAGE_SIZE - 1].created_at ?? "",
      id: rows[PUBLIC_AFFILIATE_CATALOG_PAGE_SIZE - 1].id,
    }));
    expect(rpc).toHaveBeenCalledTimes(1);
  });

  it("rejects malformed responses and propagates RPC errors", async () => {
    setClient("not-an-array");
    await expect(listPublicAffiliateProductPage()).rejects.toMatchObject({ code: "invalid-response" });

    setClient(null, new Error("database unavailable"));
    await expect(listPublicAffiliateProductPage()).rejects.toMatchObject({ code: "query-failed" });
  });

  it("does not let invalid taxonomy rows consume the page contract", async () => {
    const rpc = setClient([
      row({ leaf_slug: "invalid-leaf" as never }),
      row({ id: "550e8400-e29b-41d4-a716-446655440001" }),
    ]);

    const result = await listPublicAffiliateProductPage();

    expect(result.items).toHaveLength(1);
    expect(result.hasNextPage).toBe(false);
    expect(rpc).toHaveBeenCalledTimes(1);
  });

  it("discards invalid rows instead of returning them to the card layer", async () => {
    setClient([row({ is_active: false }), row({ image_url: "javascript:alert(1)" })]);
    await expect(listPublicAffiliateProductPage()).rejects.toMatchObject({ code: "invalid-response" });
  });

  it("refills a page when an invalid row consumes the raw limit", async () => {
    const firstBatch = [
      ...Array.from({ length: PUBLIC_AFFILIATE_CATALOG_PAGE_SIZE }, (_, index) =>
        row({
          id: `550e8400-e29b-41d4-a716-44665544${String(index).padStart(4, "0")}`,
        }),
      ),
      row({
        id: "550e8400-e29b-41d4-a716-446655449999",
        leaf_slug: "invalid-leaf" as never,
      }),
    ];
    const rpc = vi.fn()
      .mockResolvedValueOnce({ data: firstBatch, error: null })
      .mockResolvedValueOnce({ data: [row({ id: "550e8400-e29b-41d4-a716-446655449998" })], error: null });
    vi.mocked(createPublicSupabaseClient).mockReturnValue({ rpc } as unknown as AffiliateVitrineSupabaseClient);

    const result = await listPublicAffiliateProductPage();

    expect(result.items).toHaveLength(PUBLIC_AFFILIATE_CATALOG_PAGE_SIZE);
    expect(result.hasNextPage).toBe(true);
    expect(rpc).toHaveBeenCalledTimes(2);
    expect(rpc).toHaveBeenLastCalledWith("list_public_affiliate_products", expect.objectContaining({
      p_limit: 1,
      p_cursor_id: "550e8400-e29b-41d4-a716-446655449999",
    }));
  });

  it("rejects a row with an invalid created_at before cursoring", async () => {
    setClient([row({ created_at: "not-a-date" })]);
    await expect(listPublicAffiliateProductPage()).rejects.toMatchObject({ code: "invalid-response" });
  });

  it("loads a ten-page window in one bounded RPC call", async () => {
    const rows = Array.from({ length: PUBLIC_AFFILIATE_CATALOG_MAX_QUERY_LIMIT }, (_, index) =>
      row({
        id: `550e8400-e29b-41d4-a716-44665544${String(index).padStart(4, "0")}`,
        created_at: `2026-08-${String(12 - Math.floor(index / 24)).padStart(2, "0")}T00:00:00.000Z`,
      }),
    );
    const rpc = setClient(rows);

    const result = await listPublicAffiliateProductWindow({ pageNumber: 10 });

    expect(result.items).toHaveLength(240);
    expect(result.hasNextPage).toBe(true);
    expect(rpc).toHaveBeenCalledWith("list_public_affiliate_products", expect.objectContaining({
      p_limit: PUBLIC_AFFILIATE_CATALOG_MAX_QUERY_LIMIT,
    }));
  });
});
