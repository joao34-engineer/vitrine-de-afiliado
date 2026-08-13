import type { AffiliateMarketplace, AffiliateProductPricing, PublicAffiliateProduct } from "./affiliate-product";

export function formatAffiliatePrice(cents: number | null): string | null {
  if (cents === null || !Number.isFinite(cents)) {
    return null;
  }

  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(cents / 100);
}

export function getAffiliateDiscountPercent(product: Pick<PublicAffiliateProduct, keyof AffiliateProductPricing>): number | null {
  const original = product.priceOriginalCents;
  const discount = product.priceDiscountCents;

  if (original === null || discount === null || original <= 0 || discount >= original) {
    return null;
  }

  return Math.round((1 - discount / original) * 100);
}

export function getMarketplaceLabel(marketplace: AffiliateMarketplace): string {
  switch (marketplace) {
    case "shopee":
      return "Shopee";
    case "amazon":
      return "Amazon";
    case "mercado-livre":
      return "Mercado Livre";
    default:
      return "Marketplace parceiro";
  }
}
