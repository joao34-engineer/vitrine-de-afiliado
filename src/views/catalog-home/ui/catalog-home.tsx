import Link from "next/link";

import { listDepartments } from "@/shared/config/affiliate-taxonomy";
import type { PublicAffiliateProductCardData } from "@/entities/affiliate-product";
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
  return (
    <>
      <section className="home-intro">
        <div>
          <p className="eyebrow">Curadoria Salvat&amp;Brand</p>
          <h1>Ofertas que valem a sua busca.</h1>
          <p>Produtos selecionados para voce comparar com calma e conferir no marketplace parceiro.</p>
        </div>
        <div className="home-intro-note"><span>Atualizacao curta</span><strong>novas descobertas toda semana</strong></div>
      </section>
      <section className="department-overview" aria-labelledby="department-overview-title">
        <div className="section-heading-row"><div><p className="eyebrow">Navegue por interesse</p><h2 id="department-overview-title">Encontre seu proximo achado</h2></div></div>
        <div className="department-overview-grid">
          {listDepartments().filter((department) => department.slug !== "home").map((department) => (
            <Link key={department.slug} href={`/departamento/${department.slug}`} className="department-overview-link">
              <span>{department.label}</span><span aria-hidden="true">↗</span>
            </Link>
          ))}
        </div>
      </section>
      <section className="catalog-section home-offers">
        <div className="catalog-heading"><div><p className="eyebrow">Selecao recente</p><h2>Ofertas recentes</h2><p className="catalog-description">Uma selecao viva do catalogo classificado e pronto para consulta.</p></div></div>
        <CatalogProductGrid products={products} nextHref={nextHref} nextLabel={nextLabel} previousHref={previousHref} />
      </section>
    </>
  );
}
