import { beforeEach, describe, expect, it, vi } from "vitest";

const createClientMock = vi.hoisted(() => vi.fn(() => ({ mocked: true })));

vi.mock("@supabase/supabase-js", () => ({
  createClient: createClientMock,
}));
vi.mock("server-only", () => ({}));

import { createPublicSupabaseClient } from "./public-client";
import { createServerSupabaseClient } from "./server-client";
import * as publicSupabaseApi from ".";

describe("Supabase client boundaries", () => {
  beforeEach(() => {
    createClientMock.mockClear();
  });

  it("creates the public client with only the public URL and anon key", () => {
    createPublicSupabaseClient({
      NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon-key",
    });

    expect(createClientMock).toHaveBeenCalledWith(
      "https://example.supabase.co",
      "anon-key",
      expect.objectContaining({ auth: expect.any(Object) }),
    );
  });

  it("creates the server client with the service role key", () => {
    createServerSupabaseClient({
      NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
      SUPABASE_SERVICE_ROLE_KEY: "service-role-key",
    });

    expect(createClientMock).toHaveBeenCalledWith(
      "https://example.supabase.co",
      "service-role-key",
      expect.objectContaining({ auth: expect.any(Object) }),
    );
  });

  it("rejects an empty server service role key", () => {
    expect(() =>
      createServerSupabaseClient({
        NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
        SUPABASE_SERVICE_ROLE_KEY: "",
      }),
    ).toThrow("service role key");
  });

  it("does not expose the server client from the public entrypoint", () => {
    expect(publicSupabaseApi).not.toHaveProperty("createServerSupabaseClient");
  });
});
