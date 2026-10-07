"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";

import { AffiliateProductCard, type PublicAffiliateProductCardData } from "@/entities/affiliate-product";

import { loadMoreCatalogProducts } from "../api/load-more-catalog-products";

export function LoadMoreProducts({
  items: initialItems,
  nextHref: initialNextHref,
  nextLabel = "Carregar mais",
  previousHref,
  itemOffset = 0,
}: Readonly<{
  items: readonly PublicAffiliateProductCardData[];
  nextHref: string | null;
  nextLabel?: string;
  previousHref?: string | null;
  itemOffset?: number;
}>): React.JSX.Element {
  const [items, setItems] = useState<readonly PublicAffiliateProductCardData[]>(initialItems);
  const [nextHref, setNextHref] = useState<string | null>(initialNextHref);
  const [label, setLabel] = useState(nextLabel);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const sentinelRef = useRef<HTMLDivElement>(null);
  const requestLockRef = useRef(false);
  const canAppend = label === "Carregar mais";

  const loadNext = useCallback(() => {
    if (!nextHref || !canAppend || isPending || requestLockRef.current) return;
    requestLockRef.current = true;
    const href = nextHref;
    const offset = itemOffset;
    startTransition(() => {
      void loadMoreCatalogProducts(href)
        .then((result) => {
          setItems(result.items.slice(offset));
          setNextHref(result.nextHref);
          setLabel(result.nextLabel);
          setError(null);
        })
        .catch(() => {
          setError("Nao foi possivel carregar mais ofertas. Tente novamente.");
        })
        .finally(() => {
          requestLockRef.current = false;
        });
    });
  }, [canAppend, isPending, itemOffset, nextHref, startTransition]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !nextHref || !canAppend || isPending) return undefined;

    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) loadNext();
    });
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [canAppend, isPending, loadNext, nextHref]);

  const handleLoadMore = (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (!canAppend) return;
    event.preventDefault();
    loadNext();
  };

  return (
    <>
      <div className="product-grid">
        {items.map((product) => <AffiliateProductCard key={product.id} product={product} />)}
      </div>
      {canAppend && nextHref ? <div ref={sentinelRef} className="load-more-sentinel" aria-hidden="true" /> : null}
      {error ? <p className="catalog-inline-error" role="alert">{error}</p> : null}
      <nav className="catalog-pagination" aria-label="Paginacao do catalogo">
        {previousHref ? <a className="load-more-button pagination-link" href={previousHref}>Voltar</a> : null}
        {nextHref ? (
          <a
            className={canAppend ? "sr-only" : "load-more-button pagination-link"}
            href={nextHref}
            aria-busy={isPending}
            onClick={handleLoadMore}
          >
            {isPending ? "Carregando..." : label}
          </a>
        ) : null}
      </nav>
    </>
  );
}
