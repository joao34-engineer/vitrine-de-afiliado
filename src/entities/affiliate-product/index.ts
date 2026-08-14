export {
  affiliateMarketplaces,
  classificationReviewStatuses,
  isPublicAffiliateProduct,
  isPublishableAffiliateProduct,
  type AffiliateMarketplace,
  type AffiliateProductClassification,
  type AffiliateProductPricing,
  type ClassificationReviewStatus,
  type PublicAffiliateProduct,
  type PublicAffiliateProductCardData,
  type PublishableAffiliateProduct,
} from "./model/affiliate-product";
export {
  deriveAffiliateProductSlug,
  mapSupabasePublicProductRowToCard,
  mapSupabasePublicAffiliateProductDetailRow,
  mapSupabaseProductRowToPublishableAffiliateProduct,
  mapSupabaseProductRowToPublicAffiliateProduct,
} from "./model/affiliate-product-mapper";
export {
  formatAffiliatePrice,
  getAffiliateDiscountPercent,
  getMarketplaceLabel,
} from "./model/affiliate-product-presentation";
export { isAllowedAffiliateDestination } from "./model/affiliate-destination";
export {
  isHttpsUrl,
  isNonEmptyString,
  isNonNegativeFiniteNumber,
  isPublicCatalogImageUrl,
  isSupportedUuid,
  PUBLIC_CATALOG_IMAGE_HOST,
} from "./model/public-product-validation";
export { AffiliateProductCard } from "./ui/affiliate-product-card";
export {
  classifyLegacyAffiliateProduct,
  classifyLegacyAffiliateProducts,
  legacyBackfillClassificationSource,
  legacyClassificationStatuses,
  type ClassifiedLegacyAffiliateProduct,
  type LegacyAffiliateProductClassification,
  type LegacyAffiliateProductInput,
  type LegacyAffiliateProductsClassificationBatch,
  type LegacyBackfillClassificationSource,
  type LegacyClassificationReason,
  type LegacyClassificationStatus,
} from "./model/affiliate-classification";
