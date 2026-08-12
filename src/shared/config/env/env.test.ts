import { describe, expect, it } from "vitest";

import { parsePublicEnv } from ".";
import { parseServerEnv } from "./server-env-schema";

const validPublicEnv = {
  NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon-public-key",
  NEXT_PUBLIC_SITE_URL: "https://ofertas.salvatbrand.com.br",
} satisfies Record<string, string | undefined>;

describe("environment contract", () => {
  it("accepts the public Supabase configuration used by browser code", () => {
    expect(parsePublicEnv(validPublicEnv)).toEqual(validPublicEnv);
  });

  it("rejects missing public Supabase values without exposing secrets", () => {
    expect(() => parsePublicEnv({})).toThrow(
      "Public environment variables are invalid or missing: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY",
    );
  });

  it("accepts the server-only Supabase service role key", () => {
    expect(
      parseServerEnv({
        ...validPublicEnv,
        SUPABASE_SERVICE_ROLE_KEY: "service-role-secret",
      }),
    ).toMatchObject({
      NEXT_PUBLIC_SUPABASE_URL: validPublicEnv.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: validPublicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      SUPABASE_SERVICE_ROLE_KEY: "service-role-secret",
    });
  });

  it("keeps service role out of the public contract", () => {
    expect(
      parsePublicEnv({
        ...validPublicEnv,
        SUPABASE_SERVICE_ROLE_KEY: "must-not-be-public",
      }),
    ).not.toHaveProperty("SUPABASE_SERVICE_ROLE_KEY");
  });
});
