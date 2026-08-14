import type { AffiliateMarketplace } from "./affiliate-product";

const ALLOWED_HOSTS: Readonly<Record<AffiliateMarketplace, readonly string[]>> = {
  shopee: ["shopee.com.br", "shopee.com", "shope.ee", "shp.ee", "br.shp.ee"],
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
    const authority = value.slice(value.indexOf("://") + 3).split(/[/?#]/, 1)[0] ?? "";
    if (url.port !== "" || authority.includes(":")) return false;
    return ALLOWED_HOSTS[marketplace].some((allowed) =>
      allowed === "shopee.com.br" || allowed === "shopee.com"
        ? host === allowed || host.endsWith(`.${allowed}`)
        : host === allowed,
    );
  } catch {
    return false;
  }
}

export const affiliateDestinationHosts = ALLOWED_HOSTS;
