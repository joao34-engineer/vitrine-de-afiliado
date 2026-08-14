import { searchPublicAffiliateProductPages } from "@/entities/affiliate-product/index.server";
import { createCatalogPaginationHref } from "@/features/load-more-products";
import { SearchResultGrid } from "@/features/catalog-search";
import { isDepartmentLeafPair, isDepartmentSlug, isLeafSlug } from "@/shared/config/affiliate-taxonomy";
import { CatalogShell } from "@/widgets/catalog-shell";
import { notFound } from "next/navigation";
import { connection } from "next/server";

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string | string[]; pagina?: string; cursor?: string; departmentSlug?: string; leafSlug?: string }> }) {
  await connection();
  const params = await searchParams;
  const rawQuery = Array.isArray(params.q) ? params.q[0] : params.q;
  const departmentSlug = params.departmentSlug;
  const leafSlug = params.leafSlug;

  if (
    (departmentSlug !== undefined && !isDepartmentSlug(departmentSlug)) ||
    (leafSlug !== undefined && !isLeafSlug(leafSlug)) ||
    (departmentSlug !== undefined && leafSlug !== undefined && !isDepartmentLeafPair(departmentSlug, leafSlug))
  ) {
    notFound();
  }

  if (!rawQuery) {
    return <CatalogShell><section className="catalog-section search-empty"><p className="eyebrow">Busca</p><h1>O que voce quer encontrar?</h1><p>Digite o nome de um produto na barra acima para pesquisar no catalogo.</p></section></CatalogShell>;
  }

  const page = await searchPublicAffiliateProductPages({ query: rawQuery, departmentSlug, leafSlug, pageNumber: params.pagina, startingCursor: params.cursor });
  const fixedParams = { q: rawQuery, ...(departmentSlug ? { departmentSlug } : {}), ...(leafSlug ? { leafSlug } : {}) };
  const nextHref = page.hasNextPage ? createCatalogPaginationHref({ pathname: "/buscar", params: fixedParams, pageNumber: page.pageNumber < 10 ? page.pageNumber + 1 : 1, startingCursor: page.pageNumber < 10 ? page.startingCursor : page.nextCursor }) : null;
  const previousHref = page.pageNumber > 1 ? createCatalogPaginationHref({ pathname: "/buscar", params: fixedParams, pageNumber: page.pageNumber - 1, startingCursor: page.startingCursor }) : null;

  return <CatalogShell><section className="catalog-section"><div className="catalog-heading"><div><p className="eyebrow">Resultados para</p><h1>&quot;{rawQuery}&quot;</h1><p className="catalog-description">Produtos encontrados na curadoria publica.</p></div></div>{page.items.length > 0 ? <SearchResultGrid items={page.items} nextHref={nextHref} nextLabel={page.pageNumber === 10 ? "Proxima janela" : undefined} previousHref={previousHref} /> : <div className="empty-state"><h2>Nenhuma oferta encontrada</h2><p>Tente buscar por outro nome de produto.</p></div>}</section></CatalogShell>;
}
