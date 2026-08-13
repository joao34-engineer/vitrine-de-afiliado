import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { getServerEnv, type ServerEnv } from "@/shared/config/env/index.server";
import type { Database } from "@/types/supabase";

export type ServerSupabaseConfig = Pick<
  ServerEnv,
  "NEXT_PUBLIC_SUPABASE_URL" | "SUPABASE_SERVICE_ROLE_KEY"
>;
export type AffiliateVitrineServerSupabaseClient = SupabaseClient<Database>;

export function createServerSupabaseClient(
  env: ServerSupabaseConfig = getServerEnv(),
): AffiliateVitrineServerSupabaseClient {
  if (
    env.NEXT_PUBLIC_SUPABASE_URL.trim().length === 0 ||
    env.SUPABASE_SERVICE_ROLE_KEY.trim().length === 0
  ) {
    throw new Error("Server Supabase client requires URL and service role key.");
  }

  return createClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        detectSessionInUrl: false,
        persistSession: false,
      },
    },
  );
}
