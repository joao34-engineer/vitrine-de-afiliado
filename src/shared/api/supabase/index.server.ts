import "server-only";

export {
  createServerSupabaseClient,
  type AffiliateVitrineServerSupabaseClient,
  type ServerSupabaseConfig,
} from "./server-client";
export { createTrackingSupabaseClient, type TrackingSupabaseConfig } from "./tracking-client";
