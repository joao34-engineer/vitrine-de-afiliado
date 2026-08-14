import "server-only";

import { decodePublicAffiliateSearchCursor } from "../model/affiliate-search";
import type { PublicAffiliateCatalogProgressivePage } from "../model/affiliate-catalog-pagination";
import type { PublicAffiliateProductCardData } from "../model/affiliate-product";
import { PublicAffiliateProductCatalogError } from "../model/public-affiliate-product-catalog-error";
import {
  searchPublicAffiliateProductWindow,
  type PublicAffiliateProductSearchFilters,
} from "./search-public-affiliate-products";

export type PublicAffiliateProductSearchProgressiveFilters = Omit<PublicAffiliateProductSearchFilters, "cursor" | "pageSize"> & {
  readonly pageNumber?: unknown;
  readonly startingCursor?: string;
};

export async function searchPublicAffiliateProductPages(
  filters: PublicAffiliateProductSearchProgressiveFilters,
): Promise<PublicAffiliateCatalogProgressivePage<PublicAffiliateProductCardData>> {
  const startingCursor = filters.startingCursor ?? null;
  if (startingCursor !== null && decodePublicAffiliateSearchCursor(startingCursor) === null) {
    throw new PublicAffiliateProductCatalogError("invalid-filter", "Invalid search starting cursor.");
  }

  return searchPublicAffiliateProductWindow({
    query: filters.query,
    departmentSlug: filters.departmentSlug,
    leafSlug: filters.leafSlug,
    pageNumber: filters.pageNumber,
    startingCursor: startingCursor ?? undefined,
  });
}
