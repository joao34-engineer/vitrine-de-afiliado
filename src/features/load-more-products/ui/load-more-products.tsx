import { AffiliateProductCard, type PublicAffiliateProductCardData } from "@/entities/affiliate-product";

export function LoadMoreProducts({
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
  return (
    <>
      <div className="product-grid">
        {items.map((product) => <AffiliateProductCard key={product.id} product={product} />)}
      </div>
      <nav className="catalog-pagination" aria-label="Paginacao do catalogo">
        {previousHref ? <a className="load-more-button pagination-link" href={previousHref}>Voltar</a> : null}
        {nextHref ? <a className="load-more-button pagination-link" href={nextHref}>{nextLabel}</a> : null}
      </nav>
    </>
  );
}
