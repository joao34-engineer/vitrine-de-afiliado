import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

vi.mock("@/shared/lib/internal-api/auth", async () => {
  const actual = await vi.importActual<typeof import("@/shared/lib/internal-api/auth")>("@/shared/lib/internal-api/auth");
  return {
    ...actual,
    isAuthorizedAffiliateInternalRequest: vi.fn(() => true),
    readCappedJsonBody: vi.fn(async () => ({})),
  };
});

vi.mock("@/features/affiliate-product-ingestion/server/ingest-affiliate-product", async () => {
  const actual = await vi.importActual<typeof import("@/features/affiliate-product-ingestion/server/ingest-affiliate-product")>(
    "@/features/affiliate-product-ingestion/server/ingest-affiliate-product",
  );
  return {
    ...actual,
    ingestAffiliateProduct: vi.fn(),
  };
});

import {
  AffiliateProductCacheInvalidationError,
  AffiliateProductIngestionError,
  ingestAffiliateProduct,
} from "@/features/affiliate-product-ingestion/server/ingest-affiliate-product";
import { AffiliateProductAdminRepositoryError } from "@/entities/affiliate-product/api/admin-affiliate-product-repository";
import { POST } from "./route";

const productResponse = {
  id: "550e8400-e29b-41d4-a716-446655440000",
  productIdShopee: "123.456",
  disposition: "published" as const,
  classificationRevision: 1,
  changed: true,
  created: true,
  publicEligible: true,
};

function request(): Request {
  return new Request("https://ofertas.salvatbrand.com.br/api/internal/catalog/products", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-request-id": "request-123",
    },
    body: "{}",
  });
}

function responseBody(response: Response): Promise<unknown> {
  return response.json() as Promise<unknown>;
}

describe("POST /api/internal/catalog/products", () => {
  let infoSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    infoSpy = vi.spyOn(console, "info").mockImplementation(() => undefined);
  });

  afterEach(() => {
    infoSpy.mockRestore();
  });

  it("returns the ingestion result and emits a structured success log", async () => {
    vi.mocked(ingestAffiliateProduct).mockResolvedValue(productResponse);

    const response = await POST(request());

    expect(response.status).toBe(201);
    expect(response.headers.get("x-request-id")).toBe("request-123");
    await expect(responseBody(response)).resolves.toEqual(productResponse);

    const log = JSON.parse(String(infoSpy.mock.calls.at(-1)?.[1])) as Record<string, unknown>;
    expect(log).toMatchObject({
      operation: "ingest_product",
      requestId: "request-123",
      outcome: "success",
      status: 201,
    });
    expect(log.durationMs).toEqual(expect.any(Number));
  });

  it("returns a safe internal error for deterministic repository failures", async () => {
    vi.mocked(ingestAffiliateProduct).mockRejectedValue(
      new AffiliateProductAdminRepositoryError("Supabase ingestion upsert failed.", {
        operation: "upsert_ingestion",
        cause: {
          code: "42702",
          message: "column reference \"product_id_shopee\" is ambiguous",
        },
      }),
    );

    const response = await POST(request());

    expect(response.status).toBe(500);
    await expect(responseBody(response)).resolves.toEqual({ error: "catalog_rpc_error" });

    const log = JSON.parse(String(infoSpy.mock.calls.at(-1)?.[1])) as Record<string, unknown>;
    expect(log).toMatchObject({
      operation: "ingest_product",
      requestId: "request-123",
      outcome: "error",
      status: 500,
      error: {
        category: "repository",
        code: "42702",
        retryable: false,
      },
    });
    expect(JSON.stringify(log)).toContain("product_id_shopee");
  });

  it("keeps transient repository failures as a retryable unavailable response", async () => {
    vi.mocked(ingestAffiliateProduct).mockRejectedValue(
      new AffiliateProductAdminRepositoryError("Supabase unavailable.", {
        operation: "upsert_ingestion",
        cause: { code: "08006", message: "connection failure" },
      }),
    );

    const response = await POST(request());

    expect(response.status).toBe(503);
    await expect(responseBody(response)).resolves.toEqual({ error: "catalog_unavailable" });
  });

  it("keeps validation and cache failures on their safe public contracts", async () => {
    vi.mocked(ingestAffiliateProduct).mockRejectedValueOnce(new AffiliateProductIngestionError("invalid"));
    const invalidResponse = await POST(request());
    expect(invalidResponse.status).toBe(422);
    await expect(responseBody(invalidResponse)).resolves.toEqual({ error: "invalid_payload" });

    vi.mocked(ingestAffiliateProduct).mockRejectedValueOnce(new AffiliateProductCacheInvalidationError());
    const cacheResponse = await POST(request());
    expect(cacheResponse.status).toBe(503);
    await expect(responseBody(cacheResponse)).resolves.toEqual({ error: "catalog_unavailable" });
  });
});
