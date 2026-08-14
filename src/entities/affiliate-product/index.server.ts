import "server-only";

export {
  PublicAffiliateProductCatalogError,
  type PublicAffiliateProductCatalogErrorCode,
} from "./model/public-affiliate-product-catalog-error";
export {
  listPublicAffiliateProductPage,
  listPublicAffiliateProductWindow,
  type PublicAffiliateProductPageFilters,
  type PublicAffiliateProductProgressiveFilters,
} from "./api/list-public-affiliate-product-page";
export {
  listPublicAffiliateProductPages,
} from "./api/list-public-affiliate-product-pages";
export {
  getCachedPublicAffiliateProductById,
  getPublicAffiliateProductById,
  isAffiliateProductId,
} from "./api/get-public-affiliate-product";
export {
  searchPublicAffiliateProducts,
  type PublicAffiliateProductSearchFilters,
} from "./api/search-public-affiliate-products";
export {
  searchPublicAffiliateProductPages,
  type PublicAffiliateProductSearchProgressiveFilters,
} from "./api/search-public-affiliate-product-pages";
export {
  PUBLIC_AFFILIATE_CATALOG_PAGE_SIZE,
  PUBLIC_AFFILIATE_CATALOG_MAX_QUERY_LIMIT,
  PUBLIC_AFFILIATE_CATALOG_MAX_REFILL_ATTEMPTS,
  PUBLIC_AFFILIATE_CATALOG_MAX_WINDOW_SIZE,
  PUBLIC_AFFILIATE_MAX_PROGRESSIVE_PAGES,
  decodePublicAffiliateProductCursor,
  encodePublicAffiliateProductCursor,
  normalizePublicCatalogPageNumber,
  normalizePublicCatalogPageSize,
  type PublicAffiliateCatalogPage,
  type PublicAffiliateCatalogFilters,
  type PublicAffiliateProductCursor,
} from "./model/affiliate-catalog-pagination";
