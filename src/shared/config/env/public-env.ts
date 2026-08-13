import { z } from "zod";

import { formatEnvIssues } from "./env-errors";

const requiredPublicEnvString = z.string().trim().min(1);

export const publicEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: requiredPublicEnvString.url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: requiredPublicEnvString,
  NEXT_PUBLIC_SITE_URL: requiredPublicEnvString.url().optional(),
  NEXT_PUBLIC_INSTAGRAM_URL: requiredPublicEnvString.url().optional(),
  NEXT_PUBLIC_WHATSAPP_URL: requiredPublicEnvString.url().optional(),
});

export type PublicEnv = z.infer<typeof publicEnvSchema>;

export function parsePublicEnv(env: Record<string, string | undefined>): PublicEnv {
  const parsed = publicEnvSchema.safeParse(env);

  if (!parsed.success) {
    throw new Error(formatEnvIssues("Public", parsed.error.issues));
  }

  return parsed.data;
}

export function getPublicEnv(): PublicEnv {
  return parsePublicEnv(process.env);
}
