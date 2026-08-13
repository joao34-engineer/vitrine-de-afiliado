import Link from "next/link";

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
}: Readonly<{
  eyebrow: string;
  title: string;
  description: string;
  products: readonly PublicAffiliateProductCardData[];
  nextHref: string | null;
  nextLabel?: string;
  previousHref?: string | null;
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
      {products.length > 0 ? (
        <CatalogProductGrid products={products} nextHref={nextHref} nextLabel={nextLabel} previousHref={previousHref} />
      ) : (
        <div className="empty-state"><h2>Nenhuma oferta encontrada</h2><p>Estamos atualizando esta selecao. Explore outro departamento.</p></div>
      )}
    </section>
  );
}
