import { z } from "zod";

export const approveAffiliateReviewRequestSchema = z.object({
  leafSlug: z.string().trim().min(1).max(100),
  expectedRevision: z.number().int().nonnegative(),
  operationId: z.string().uuid(),
}).strict();

export const deactivateAffiliateReviewRequestSchema = z.object({
  expectedRevision: z.number().int().nonnegative(),
  operationId: z.string().uuid(),
}).strict();
