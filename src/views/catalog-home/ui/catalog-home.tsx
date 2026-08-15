import Link from "next/link";

import { AffiliateProductCard, type PublicAffiliateProductCardData } from "@/entities/affiliate-product";
import { listDepartments } from "@/shared/config/affiliate-taxonomy";
import { CatalogProductGrid } from "@/widgets/catalog-product-grid";

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
  const hasCuratedHero = products.length >= 2;
  const heroProducts = hasCuratedHero ? products.slice(0, 2) : [];
  const offerProducts = hasCuratedHero ? products.slice(2) : products;

  return (
    <>
      <section className="home-intro">
        <p className="eyebrow">Curadoria da semana</p>
        <h1>Achados bons o bastante para virar favorito.</h1>
        <p>Selecao curta, preco claro e clique direto para a oferta.</p>
      </section>

      <section className="department-overview" aria-labelledby="department-overview-title">
        <div className="section-heading-row">
          <div>
            <p className="eyebrow">Navegue por interesse</p>
            <h2 id="department-overview-title">Encontre seu proximo achado</h2>
          </div>
        </div>
        <div className="department-overview-grid">
          {listDepartments().filter((department) => department.slug !== "home").map((department) => (
            <Link key={department.slug} href={`/departamento/${department.slug}`} className="department-overview-link">
              <span>{department.label}</span>
              <span aria-hidden="true">›</span>
            </Link>
          ))}
        </div>
      </section>

      {hasCuratedHero ? (
        <section className="home-curated-hero" aria-labelledby="home-curated-title">
          <p className="eyebrow">Curadoria da semana</p>
          <h2 id="home-curated-title">Achados bons o bastante para virar favorito.</h2>
          <p>Selecao curta, preco claro e clique direto para a oferta.</p>
          <div className="home-hero-products">
            {heroProducts.map((product) => <AffiliateProductCard key={product.id} product={product} variant="hero" />)}
          </div>
        </section>
      ) : null}

      <section className="catalog-section home-offers">
        <div className="catalog-heading">
          <div>
            <h2>Achados em alta</h2>
            <p className="catalog-description">Produtos que merecem entrar na sua lista hoje.</p>
          </div>
        </div>
        <CatalogProductGrid products={offerProducts} nextHref={nextHref} nextLabel={nextLabel} previousHref={previousHref} />
      </section>
    </>
  );
}
