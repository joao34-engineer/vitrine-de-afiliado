import type { AffiliateMarketplace } from "./affiliate-product";

const ALLOWED_HOSTS: Readonly<Record<AffiliateMarketplace, readonly string[]>> = {
  shopee: ["shopee.com.br", "shopee.com", "shope.ee", "shp.ee", "shopeesz.com"],
  amazon: ["amazon.com.br", "amazon.com", "amzn.to"],
  "mercado-livre": ["mercadolivre.com.br", "mercadolibre.com"],
  other: [],
};

export function isAllowedAffiliateDestination(
  value: unknown,
  marketplace: AffiliateMarketplace,
): value is string {
  if (typeof value !== "string") return false;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:") return false;
    const host = url.hostname.toLowerCase();
    return ALLOWED_HOSTS[marketplace].some(
      (allowed) => host === allowed || host.endsWith(`.${allowed}`),
    );
  } catch {
    return false;
  }
}
