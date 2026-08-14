import "server-only";

import {
  decodePublicAffiliateProductCursor,
  normalizePublicCatalogPageNumber,
  type PublicAffiliateCatalogProgressivePage,
} from "../model/affiliate-catalog-pagination";
import type { PublicAffiliateProductCardData } from "../model/affiliate-product";
import { PublicAffiliateProductCatalogError } from "../model/public-affiliate-product-catalog-error";
import {
  listPublicAffiliateProductWindow,
  type PublicAffiliateProductProgressiveFilters,
} from "./list-public-affiliate-product-page";

export async function listPublicAffiliateProductPages(
  filters: PublicAffiliateProductProgressiveFilters = {},
): Promise<PublicAffiliateCatalogProgressivePage<PublicAffiliateProductCardData>> {
  let pageNumber: number;
  try {
    pageNumber = normalizePublicCatalogPageNumber(filters.pageNumber);
  } catch (error) {
    throw new PublicAffiliateProductCatalogError(
      "invalid-filter",
      error instanceof Error ? error.message : "Invalid catalog page number.",
      { cause: error },
    );
  }

  const startingCursor = filters.startingCursor ?? null;
  if (startingCursor !== null && decodePublicAffiliateProductCursor(startingCursor) === null) {
    throw new PublicAffiliateProductCatalogError("invalid-filter", "Invalid catalog starting cursor.");
  }

  return listPublicAffiliateProductWindow({
    departmentSlug: filters.departmentSlug,
    leafSlug: filters.leafSlug,
    pageNumber,
    startingCursor: startingCursor ?? undefined,
  });
}
