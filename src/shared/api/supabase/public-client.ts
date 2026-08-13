import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/supabase";
import { getPublicEnv, type PublicEnv } from "@/shared/config/env";

export type AffiliateVitrineSupabaseClient = SupabaseClient<Database>;
export type PublicSupabaseConfig = Pick<
  PublicEnv,
  "NEXT_PUBLIC_SUPABASE_URL" | "NEXT_PUBLIC_SUPABASE_ANON_KEY"
>;

export function createPublicSupabaseClient(
  env: PublicSupabaseConfig = getPublicEnv(),
): AffiliateVitrineSupabaseClient {
  if (
    env.NEXT_PUBLIC_SUPABASE_URL.trim().length === 0 ||
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY.trim().length === 0
  ) {
    throw new Error("Public Supabase client requires URL and anon key.");
  }

  return createClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      auth: {
        autoRefreshToken: false,
        detectSessionInUrl: false,
        persistSession: false,
      },
    },
  );
}
