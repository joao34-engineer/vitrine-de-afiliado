import type { PublicAffiliateProductCardData } from "@/entities/affiliate-product";

import { LoadMoreProducts } from "@/features/load-more-products";

export function CatalogProductGrid({
  products,
  nextHref,
  nextLabel,
  previousHref,
}: Readonly<{
  products: readonly PublicAffiliateProductCardData[];
  nextHref: string | null;
  nextLabel?: string;
  previousHref?: string | null;
}>): React.JSX.Element {
  return (
    <LoadMoreProducts
      items={products}
      nextHref={nextHref}
      nextLabel={nextLabel}
      previousHref={previousHref}
    />
  );
}
