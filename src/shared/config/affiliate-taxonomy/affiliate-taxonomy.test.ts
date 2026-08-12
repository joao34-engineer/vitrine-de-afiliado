import { describe, expect, it } from "vitest";

import {
  affiliateDepartmentSlugs,
  affiliateLeafSlugs,
  affiliateSubcategorySlugs,
  findLeafBySlug,
  getLeafBySlug,
  isDepartmentLeafPair,
  isDepartmentSlug,
  isLeafSlug,
  isSubcategorySlug,
  listLeaves,
} from ".";

function expectUnique(values: readonly string[]): void {
  expect(new Set(values).size).toBe(values.length);
}

describe("affiliate taxonomy", () => {
  it("keeps canonical slug lists unique by kind", () => {
    expectUnique(affiliateDepartmentSlugs);
    expectUnique(affiliateSubcategorySlugs);
    expectUnique(affiliateLeafSlugs);
  });

  it("keeps every leaf attached to an existing department", () => {
    for (const leaf of listLeaves()) {
      expect(isDepartmentSlug(leaf.departmentSlug)).toBe(true);
    }
  });

  it("keeps every leaf subcategory attached to the canonical subcategory list", () => {
    for (const leaf of listLeaves()) {
      expect(leaf.subcategorySlug === null || isSubcategorySlug(leaf.subcategorySlug)).toBe(true);
    }
  });

  it("validates canonical slugs and rejects unknown values", () => {
    expect(isDepartmentSlug("tech")).toBe(true);
    expect(isDepartmentSlug("shopify")).toBe(false);
    expect(isSubcategorySlug("audio")).toBe(true);
    expect(isSubcategorySlug("relogios")).toBe(false);
    expect(isLeafSlug("games-e-pc")).toBe(true);
    expect(isLeafSlug("todos")).toBe(false);
  });

  it("finds leaves and validates department to leaf pairs", () => {
    expect(findLeafBySlug("audio")?.departmentSlug).toBe("tech");
    expect(getLeafBySlug("achadinhos-gerais").departmentSlug).toBe("mais");
    expect(isDepartmentLeafPair("tech", "audio")).toBe(true);
    expect(isDepartmentLeafPair("casa", "audio")).toBe(false);
    expect(isDepartmentLeafPair("tech", "unknown")).toBe(false);
  });
});
