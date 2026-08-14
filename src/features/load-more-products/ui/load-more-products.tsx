"use client";

import { useState, useTransition } from "react";

import { AffiliateProductCard, type PublicAffiliateProductCardData } from "@/entities/affiliate-product";

import { loadMoreCatalogProducts } from "../api/load-more-catalog-products";

export function LoadMoreProducts({
  items: initialItems,
  nextHref: initialNextHref,
  nextLabel = "Carregar mais",
  previousHref,
}: Readonly<{
  items: readonly PublicAffiliateProductCardData[];
  nextHref: string | null;
  nextLabel?: string;
  previousHref?: string | null;
}>): React.JSX.Element {
  const [items, setItems] = useState<readonly PublicAffiliateProductCardData[]>(initialItems);
  const [nextHref, setNextHref] = useState<string | null>(initialNextHref);
  const [label, setLabel] = useState(nextLabel);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const canAppend = label === "Carregar mais";

  const handleLoadMore = (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (!nextHref || !canAppend || isPending) return;
    event.preventDefault();
    const href = nextHref;
    startTransition(() => {
      void loadMoreCatalogProducts(href)
        .then((result) => {
          setItems((currentItems) => [...currentItems, ...result.items]);
          setNextHref(result.nextHref);
          setLabel(result.nextLabel);
          setError(null);
        })
        .catch(() => {
          setError("Nao foi possivel carregar mais ofertas. Tente novamente.");
        });
    });
  };

  return (
    <>
      <div className="product-grid">
        {items.map((product) => <AffiliateProductCard key={product.id} product={product} />)}
      </div>
      {error ? <p className="catalog-inline-error" role="alert">{error}</p> : null}
      <nav className="catalog-pagination" aria-label="Paginacao do catalogo">
        {previousHref ? <a className="load-more-button pagination-link" href={previousHref}>Voltar</a> : null}
        {nextHref ? (
          <a className="load-more-button pagination-link" href={nextHref} aria-busy={isPending} onClick={handleLoadMore}>
            {isPending ? "Carregando..." : label}
          </a>
        ) : null}
      </nav>
    </>
  );
}
