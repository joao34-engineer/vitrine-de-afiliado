import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/shared/api/supabase/index.server", () => ({ createServerSupabaseClient: vi.fn() }));

import { createServerSupabaseClient, type AffiliateVitrineServerSupabaseClient } from "@/shared/api/supabase/index.server";
import { classifyAffiliateProductForIngestion } from "../model/affiliate-ingestion-classification";
import { affiliateProductIngestionRequestSchema } from "../model/affiliate-ingestion";
import { AffiliateProductAdminRepository, AffiliateProductAdminRepositoryError } from "./admin-affiliate-product-repository";

describe("AffiliateProductAdminRepositoryError", () => {
  it("keeps SQL ambiguity failures non-retryable and sanitizes safe metadata", () => {
    const error = new AffiliateProductAdminRepositoryError("Supabase ingestion upsert failed.", {
      operation: "upsert_ingestion",
      cause: {
        code: "42702",
        message: "column reference \"product_id_shopee\" is ambiguous",
      },
    });

    expect(error.metadata).toEqual({
      operation: "upsert_ingestion",
      rpcName: "upsert_affiliate_product_ingestion",
      status: null,
      code: "42702",
      message: 'column reference "product_id_shopee" is ambiguous',
      retryable: false,
    });
  });

  it("classifies connection and transient HTTP failures as retryable", () => {
    const connectionError = new AffiliateProductAdminRepositoryError("Supabase unavailable.", {
      operation: "upsert_ingestion",
      cause: { code: "08006", message: "connection failure" },
    });
    const gatewayError = new AffiliateProductAdminRepositoryError("Supabase unavailable.", {
      operation: "upsert_ingestion",
      cause: { code: "PGRST503", status: 503, message: "service unavailable" },
    });

    expect(connectionError.metadata.retryable).toBe(true);
    expect(gatewayError.metadata.retryable).toBe(true);
    expect(gatewayError.metadata.status).toBe(503);
    expect(gatewayError.metadata.rpcName).toBe("upsert_affiliate_product_ingestion");
    expect(
      new AffiliateProductAdminRepositoryError("Supabase approval failed.", { operation: "approve" }).metadata.rpcName,
    ).toBe("approve_affiliate_product_classification");
    expect(
      new AffiliateProductAdminRepositoryError("Supabase deactivation failed.", { operation: "deactivate" }).metadata.rpcName,
    ).toBe("deactivate_affiliate_product");
  });

  it("uses the PostgREST status returned beside data and error", () => {
    const error = new AffiliateProductAdminRepositoryError("Supabase unavailable.", {
      operation: "upsert_ingestion",
      status: 503,
      cause: { code: "PGRST001", message: "database connection unavailable" },
    });

    expect(error.metadata).toMatchObject({
      rpcName: "upsert_affiliate_product_ingestion",
      status: 503,
      retryable: true,
    });
  });

  it("preserves the RPC status returned beside data and error", async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: null,
      error: { code: "PGRST001", message: "database connection unavailable" },
      status: 503,
    });
    vi.mocked(createServerSupabaseClient).mockReturnValue({ rpc } as unknown as AffiliateVitrineServerSupabaseClient);

    const product = affiliateProductIngestionRequestSchema.parse({
      productIdShopee: "123.456",
      title: "Fone Bluetooth",
      priceOriginal: 129.9,
      priceDiscount: 99.9,
      imageUrl: "https://cf.shopee.com.br/file/fone.jpg",
      affiliateUrl: "https://shopee.com.br/product/123",
      aiCopy: null,
      legacyCategory: "Eletronicos",
    });
    const classification = classifyAffiliateProductForIngestion(product);

    await expect(new AffiliateProductAdminRepository().upsertIngestion(product, classification)).rejects.toMatchObject({
      metadata: {
        rpcName: "upsert_affiliate_product_ingestion",
        status: 503,
        retryable: true,
      },
    });
    expect(rpc).toHaveBeenCalledWith("upsert_affiliate_product_ingestion", expect.any(Object));
  });

  it("redacts credentials and caps error messages", () => {
    const error = new AffiliateProductAdminRepositoryError("Supabase failed.", {
      operation: "upsert_ingestion",
      cause: {
        code: "XX000",
        message: `Bearer super-secret token=abc password:xyz ${"x".repeat(400)}`,
      },
    });

    expect(error.metadata.message).not.toContain("super-secret");
    expect(error.metadata.message).not.toContain("abc");
    expect(error.metadata.message).not.toContain("xyz");
    expect(error.metadata.message.length).toBeLessThanOrEqual(240);
  });
});
