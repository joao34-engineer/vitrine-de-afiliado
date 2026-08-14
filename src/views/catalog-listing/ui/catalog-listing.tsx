import Link from "next/link";

import { DepartmentMenuButton, DepartmentRail } from "@/features/department-navigation";
import type { DepartmentSlug, LeafSlug } from "@/shared/config/affiliate-taxonomy";
import type { PublicAffiliateProductCardData } from "@/entities/affiliate-product";
import { CatalogProductGrid } from "@/widgets/catalog-product-grid";

export function CatalogListing({
  eyebrow,
  title,
  description,
  products,
  nextHref,
  nextLabel,
  previousHref,
  departmentSlug,
  leafSlug,
}: Readonly<{
  eyebrow: string;
  title: string;
  description: string;
  products: readonly PublicAffiliateProductCardData[];
  nextHref: string | null;
  nextLabel?: string;
  previousHref?: string | null;
  departmentSlug?: DepartmentSlug;
  leafSlug?: LeafSlug;
}>): React.JSX.Element {
  return (
    <section className="catalog-section">
      <div className="catalog-heading">
        <div>
          <p className="eyebrow">{eyebrow}</p>
          <h1>{title}</h1>
          <p className="catalog-description">{description}</p>
        </div>
        <Link href="/" className="text-link">Ver todos os departamentos</Link>
      </div>
      <div className="listing-controls">
        <form className="listing-search-form" action="/buscar" method="get" role="search">
          <label className="sr-only" htmlFor="listing-search">Buscar nesta folha</label>
          <input id="listing-search" name="q" type="search" placeholder="Buscar nesta folha" autoComplete="off" />
          {departmentSlug ? <input type="hidden" name="departmentSlug" value={departmentSlug} /> : null}
          {leafSlug ? <input type="hidden" name="leafSlug" value={leafSlug} /> : null}
          <button type="submit" aria-label="Buscar nesta folha">⌕</button>
        </form>
        <DepartmentMenuButton label="Filtros" className="listing-filter-button" />
      </div>
      <DepartmentRail className="listing-department-rail" />
      {products.length > 0 ? (
        <CatalogProductGrid products={products} nextHref={nextHref} nextLabel={nextLabel} previousHref={previousHref} />
      ) : (
        <div className="empty-state"><h2>Nenhuma oferta encontrada</h2><p>Estamos atualizando esta selecao. Explore outro departamento.</p></div>
      )}
    </section>
  );
}
