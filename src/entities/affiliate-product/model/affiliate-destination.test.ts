import { describe, expect, it } from "vitest";

import { isAllowedAffiliateDestination } from "./affiliate-destination";

describe("affiliate destination allowlist", () => {
  it("accepts HTTPS Shopee destinations and rejects open redirects", () => {
    expect(isAllowedAffiliateDestination("https://shopee.com.br/product/123", "shopee")).toBe(true);
    expect(isAllowedAffiliateDestination("http://shopee.com.br/product/123", "shopee")).toBe(false);
    expect(isAllowedAffiliateDestination("https://evil.example/product/123", "shopee")).toBe(false);
  });
});
