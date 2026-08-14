import { describe, expect, it } from "vitest";

import {
  decodePublicAffiliateProductCursor,
  encodePublicAffiliateProductCursor,
  normalizePublicCatalogPageNumber,
  normalizePublicCatalogPageSize,
} from "./affiliate-catalog-pagination";

describe("affiliate catalog pagination", () => {
  it("encodes and validates an opaque keyset cursor", () => {
    const encoded = encodePublicAffiliateProductCursor({
      createdAt: "2026-08-13T00:00:00.000Z",
      id: "550e8400-e29b-41d4-a716-446655440000",
    });
    expect(decodePublicAffiliateProductCursor(encoded)).toEqual({
      createdAt: "2026-08-13T00:00:00.000Z",
      id: "550e8400-e29b-41d4-a716-446655440000",
    });
    expect(decodePublicAffiliateProductCursor("not-a-cursor")).toBeNull();
  });

  it("keeps the public page size bounded", () => {
    expect(normalizePublicCatalogPageSize(undefined)).toBe(24);
    expect(normalizePublicCatalogPageSize(12)).toBe(12);
    expect(() => normalizePublicCatalogPageSize(25)).toThrow();
  });

  it("accepts a modern UUID v7 in the public cursor", () => {
    const encoded = encodePublicAffiliateProductCursor({
      createdAt: "2026-08-13T00:00:00.000Z",
      id: "018f47bf-8f47-7f32-995e-db19a8753c81",
    });

    expect(decodePublicAffiliateProductCursor(encoded)?.id).toBe(
      "018f47bf-8f47-7f32-995e-db19a8753c81",
    );
  });

  it("limits progressive navigation to ten server-rendered pages", () => {
    expect(normalizePublicCatalogPageNumber("10")).toBe(10);
    expect(() => normalizePublicCatalogPageNumber("11")).toThrow();
  });
});
