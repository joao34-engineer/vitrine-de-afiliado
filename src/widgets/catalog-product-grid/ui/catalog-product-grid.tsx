import type { PublicAffiliateProductCardData } from "@/entities/affiliate-product";

import { LoadMoreProducts } from "@/features/load-more-products";

export function CatalogProductGrid({
  products,
  nextHref,
  nextLabel,
  previousHref,
  itemOffset = 0,
}: Readonly<{
  products: readonly PublicAffiliateProductCardData[];
  nextHref: string | null;
  nextLabel?: string;
  previousHref?: string | null;
  itemOffset?: number;
}>): React.JSX.Element {
  return (
    <LoadMoreProducts
      items={products}
      nextHref={nextHref}
      nextLabel={nextLabel}
      previousHref={previousHref}
      itemOffset={itemOffset}
    />
  );
}
