import Link from "next/link";

import { AffiliateProductCard, type PublicAffiliateProductCardData } from "@/entities/affiliate-product";
import { CatalogProductGrid } from "@/widgets/catalog-product-grid";

function HomeOffers({
  className,
  headingId,
  products,
  nextHref,
  nextLabel,
  previousHref,
}: Readonly<{
  className: string;
  headingId?: string;
  products: readonly PublicAffiliateProductCardData[];
  nextHref: string | null;
  nextLabel?: string;
  previousHref?: string | null;
}>): React.JSX.Element {
  return (
    <section className={`catalog-section home-offers ${className}`.trim()} id={headingId}>
      <div className="catalog-heading">
        <div>
          <h2>Achados em alta</h2>
          <p className="catalog-description">Produtos que merecem entrar na sua lista hoje.</p>
        </div>
      </div>
      <CatalogProductGrid products={products} nextHref={nextHref} nextLabel={nextLabel} previousHref={previousHref} />
    </section>
  );
}

export function CatalogHome({
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
  const hasDesktopHero = products.length >= 3;
  const hasCuratedHero = products.length >= 2;
  const desktopHeroProducts = hasDesktopHero ? products.slice(0, 3) : [];
  const desktopOfferProducts = hasDesktopHero ? products.slice(3) : products;
  const heroProducts = hasCuratedHero ? products.slice(0, 2) : [];
  const offerProducts = hasCuratedHero ? products.slice(2) : products;

  return (
    <>
      {hasDesktopHero ? (
        <section className="home-desktop-hero" aria-labelledby="home-desktop-title">
          <div className="home-desktop-editorial">
            <p className="eyebrow">Curadoria da semana</p>
            <h1 id="home-desktop-title">Achados bons o bastante para virar favorito</h1>
            <p>Selecao curta, preco claro e clique direto para a oferta.</p>
            <Link href="#home-offers" className="home-desktop-cta">Explorar achados</Link>
          </div>
          <div className="home-desktop-showcase">
            {desktopHeroProducts.map((product) => <AffiliateProductCard key={product.id} product={product} variant="hero" />)}
          </div>
        </section>
      ) : null}

      {hasCuratedHero ? (
        <section className="home-curated-hero" aria-labelledby="home-curated-title">
          <p className="eyebrow">Curadoria da semana</p>
          <h2 id="home-curated-title">Achados bons o bastante para virar favorito</h2>
          <p>Selecao curta, preco claro e clique direto para a oferta.</p>
          <div className="home-hero-products">
            {heroProducts.map((product) => <AffiliateProductCard key={product.id} product={product} variant="hero" />)}
          </div>
        </section>
      ) : null}

      <HomeOffers
        className="home-offers-desktop"
        headingId="home-offers"
        products={desktopOfferProducts}
        nextHref={nextHref}
        nextLabel={nextLabel}
        previousHref={previousHref}
      />
      <HomeOffers
        className="home-offers-mobile"
        products={offerProducts}
        nextHref={nextHref}
        nextLabel={nextLabel}
        previousHref={previousHref}
      />
    </>
  );
}
