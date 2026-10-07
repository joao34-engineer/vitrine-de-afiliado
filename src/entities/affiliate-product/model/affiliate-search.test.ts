import { describe, expect, it } from "vitest";

import { normalizePublicAffiliateSearchQuery } from "./affiliate-search";

describe("normalizePublicAffiliateSearchQuery", () => {
  it("trims and keeps a query inside the public length bounds", () => {
    expect(normalizePublicAffiliateSearchQuery("  calcado  ")).toBe("calcado");
  });

  it("rejects a one-character query", () => {
    expect(() => normalizePublicAffiliateSearchQuery("a")).toThrow(/between 2 and 120/);
  });

  it("rejects a whitespace-only query", () => {
    expect(() => normalizePublicAffiliateSearchQuery("   ")).toThrow(/between 2 and 120/);
  });
});
