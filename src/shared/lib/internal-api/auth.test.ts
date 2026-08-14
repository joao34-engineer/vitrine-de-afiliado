import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { isAuthorizedAffiliateInternalRequest } from "./auth";

describe("affiliate internal API auth", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon-key");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "service-role-key");
    vi.stubEnv("AFFILIATE_VITRINE_INTERNAL_SECRET", "test-secret");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("requires HTTPS outside localhost and validates the bearer secret", () => {
    expect(isAuthorizedAffiliateInternalRequest(new Request("http://localhost/api/internal", {
      headers: { authorization: "Bearer test-secret" },
    }))).toBe(true);
    expect(isAuthorizedAffiliateInternalRequest(new Request("http://example.com/api/internal", {
      headers: { authorization: "Bearer test-secret" },
    }))).toBe(false);
    expect(isAuthorizedAffiliateInternalRequest(new Request("https://example.com/api/internal", {
      headers: { authorization: "Bearer test-secret" },
    }))).toBe(true);
  });

  it("rejects malformed authorization headers", () => {
    expect(isAuthorizedAffiliateInternalRequest(new Request("https://example.com/api/internal", {
      headers: { authorization: "Basic test-secret" },
    }))).toBe(false);
  });
});
