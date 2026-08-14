import type { PublicAffiliateProductCardData } from "@/entities/affiliate-product";
import { LoadMoreProducts } from "@/features/load-more-products";

export function SearchResultGrid({
  items,
  nextHref,
  nextLabel = "Carregar mais",
  previousHref,
}: Readonly<{
  items: readonly PublicAffiliateProductCardData[];
  nextHref: string | null;
  nextLabel?: string;
  previousHref?: string | null;
}>): React.JSX.Element {
  return <LoadMoreProducts items={items} nextHref={nextHref} nextLabel={nextLabel} previousHref={previousHref} />;
}
