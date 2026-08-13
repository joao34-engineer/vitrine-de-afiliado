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
  mapSupabaseProductRowToPublishableAffiliateProduct,
  mapSupabaseProductRowToPublicAffiliateProduct,
} from "./model/affiliate-product-mapper";
export {
  formatAffiliatePrice,
  getAffiliateDiscountPercent,
  getMarketplaceLabel,
} from "./model/affiliate-product-presentation";
export { isAllowedAffiliateDestination } from "./model/affiliate-destination";
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
