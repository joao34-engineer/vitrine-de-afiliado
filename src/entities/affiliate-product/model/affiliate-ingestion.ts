import { z } from "zod";

import { isAllowedAffiliateDestination } from "./affiliate-destination";
import { isPublicCatalogImageUrl } from "./public-product-validation";

const trimmedText = (max: number) => z.string().trim().min(1).max(max);

export const affiliateProductIngestionRequestSchema = z
  .object({
    productIdShopee: trimmedText(128),
    title: trimmedText(300),
    priceOriginal: z.number().finite().positive(),
    priceDiscount: z.number().finite().positive(),
    imageUrl: z.string().trim().url().refine(isPublicCatalogImageUrl, "imageUrl must use the confirmed Shopee image host"),
    affiliateUrl: z.string().trim().url().refine(
      (value) => isAllowedAffiliateDestination(value, "shopee"),
      "affiliateUrl must be an HTTPS Shopee destination",
    ),
    aiCopy: z.string().trim().max(5000).nullable(),
    legacyCategory: z.string().trim().max(160).nullable(),
  })
  .strict();

export type AffiliateProductIngestionRequest = z.infer<typeof affiliateProductIngestionRequestSchema>;

export type AffiliateProductIngestionDisposition = "published" | "review" | "inactive";

export type AffiliateProductIngestionResponse = {
  readonly id: string;
  readonly productIdShopee: string;
  readonly disposition: AffiliateProductIngestionDisposition;
  readonly classificationRevision: number;
  readonly changed: boolean;
  readonly created: boolean;
  readonly publicEligible: boolean;
};
