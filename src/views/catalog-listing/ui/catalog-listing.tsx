import Link from "next/link";

import { DepartmentMenuButton, DepartmentRail } from "@/features/department-navigation";
import {
  findDepartmentBySlug,
  getLeafBySlug,
  listLeaves,
  type DepartmentSlug,
  type LeafSlug,
} from "@/shared/config/affiliate-taxonomy";
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
  const department = departmentSlug ? findDepartmentBySlug(departmentSlug) : null;
  const leaves = departmentSlug
    ? listLeaves().filter((leaf) => leaf.departmentSlug === departmentSlug)
    : [];
  const contextChip = leafSlug ? getLeafBySlug(leafSlug).label : department?.label;

  return (
    <section className="catalog-section listing-section">
      {department && departmentSlug ? (
        <aside className="listing-filter-rail" aria-label={`Folhas de ${department.label}`}>
          <p className="listing-rail-title">Categorias de {department.label}</p>
          <Link
            href={`/departamento/${departmentSlug}`}
            className={`listing-rail-row ${leafSlug === undefined ? "is-active" : ""}`.trim()}
          >
            <span>Todos</span>
            <span aria-hidden="true">›</span>
          </Link>
          {leaves.map((leaf) => (
            <Link
              key={leaf.slug}
              href={`/folha/${leaf.slug}`}
              className={`listing-rail-row ${leafSlug === leaf.slug ? "is-active" : ""}`.trim()}
            >
              <span>{leaf.label}</span>
              <span aria-hidden="true">›</span>
            </Link>
          ))}
        </aside>
      ) : null}
      <div className="listing-content">
        <div className="catalog-heading">
          <div>
            <p className="eyebrow">{eyebrow}</p>
            <h1>{title}</h1>
            <p className="catalog-description">{description}</p>
          </div>
        </div>
        <div className="listing-controls">
          <form className="listing-search-form" action="/buscar" method="get" role="search">
            <label className="sr-only" htmlFor="listing-search">Buscar nesta folha</label>
            <span aria-hidden="true" className="search-leading-icon">⌕</span>
            <input id="listing-search" name="q" type="search" placeholder="Buscar nesta folha" autoComplete="off" />
            {departmentSlug ? <input type="hidden" name="departmentSlug" value={departmentSlug} /> : null}
            {leafSlug ? <input type="hidden" name="leafSlug" value={leafSlug} /> : null}
            <button type="submit" aria-label="Buscar nesta folha">Buscar</button>
          </form>
          {contextChip ? <span className="listing-context-chip">{contextChip}</span> : null}
          <DepartmentMenuButton label="Filtros" className="listing-filter-button" />
        </div>
        <DepartmentRail className="listing-department-rail" />
        {products.length > 0 ? (
          <CatalogProductGrid products={products} nextHref={nextHref} nextLabel={nextLabel} previousHref={previousHref} />
        ) : (
          <div className="empty-state"><h2>Nenhuma oferta encontrada</h2><p>Estamos atualizando esta selecao. Explore outro departamento.</p></div>
        )}
      </div>
    </section>
  );
}
