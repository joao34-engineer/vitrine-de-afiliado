import "server-only";

import {
  decodePublicAffiliateProductCursor,
  normalizePublicCatalogPageNumber,
  type PublicAffiliateCatalogProgressivePage,
} from "../model/affiliate-catalog-pagination";
import type { PublicAffiliateProductCardData } from "../model/affiliate-product";
import { PublicAffiliateProductCatalogError } from "../model/public-affiliate-product-catalog-error";
import {
  listPublicAffiliateProductPage,
  type PublicAffiliateProductPageFilters,
} from "./list-public-affiliate-product-page";

export type PublicAffiliateProductProgressiveFilters = Omit<PublicAffiliateProductPageFilters, "cursor" | "pageSize"> & {
  readonly pageNumber?: unknown;
  readonly startingCursor?: string;
};

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

  const items: PublicAffiliateProductCardData[] = [];
  let cursor = startingCursor;
  let hasNextPage = false;

  for (let pageIndex = 0; pageIndex < pageNumber; pageIndex += 1) {
    const page = await listPublicAffiliateProductPage({
      departmentSlug: filters.departmentSlug,
      leafSlug: filters.leafSlug,
      cursor: cursor ?? undefined,
    });
    items.push(...page.items);
    cursor = page.nextCursor;
    hasNextPage = page.hasNextPage;
    if (!hasNextPage) break;
  }

  return {
    items,
    nextCursor: hasNextPage ? cursor : null,
    hasNextPage,
    pageNumber,
    startingCursor,
  };
}
