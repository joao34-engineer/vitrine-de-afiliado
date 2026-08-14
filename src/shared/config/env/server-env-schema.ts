import { z } from "zod";

import { formatEnvIssues } from "./env-errors";
import { publicEnvSchema } from "./public-env";

const requiredServerEnvString = z.string().trim().min(1);

export const serverEnvSchema = publicEnvSchema.extend({
  SUPABASE_SERVICE_ROLE_KEY: requiredServerEnvString,
  SUPABASE_CLICK_KEY: requiredServerEnvString.optional(),
  AFFILIATE_VITRINE_INTERNAL_SECRET: requiredServerEnvString.optional(),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

export function parseServerEnv(env: Record<string, string | undefined>): ServerEnv {
  const parsed = serverEnvSchema.safeParse(env);

  if (!parsed.success) {
    throw new Error(formatEnvIssues("Server", parsed.error.issues));
  }

  return parsed.data;
}
