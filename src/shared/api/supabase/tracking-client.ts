import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/supabase";
import { getPublicEnv } from "@/shared/config/env";

export type TrackingSupabaseConfig = {
  readonly supabaseUrl?: string;
  readonly clickKey?: string;
};

export function createTrackingSupabaseClient(
  config: TrackingSupabaseConfig = {},
): SupabaseClient<Database> | null {
  const env = getPublicEnv();
  const supabaseUrl = (config.supabaseUrl ?? env.NEXT_PUBLIC_SUPABASE_URL).trim();
  const clickKey = (config.clickKey ?? process.env.SUPABASE_CLICK_KEY ?? "").trim();

  if (supabaseUrl.length === 0 || clickKey.length === 0) {
    return null;
  }

  return createClient<Database>(supabaseUrl, clickKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  });
}
