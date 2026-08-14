import { listPublicAffiliateProductPages } from "@/entities/affiliate-product/index.server";
import { createCatalogPaginationHref } from "@/features/load-more-products";
import { findLeafBySlug, isLeafSlug } from "@/shared/config/affiliate-taxonomy";
import { CatalogListing } from "@/views/catalog-listing";
import { CatalogShell } from "@/widgets/catalog-shell";
import { connection } from "next/server";
import { notFound } from "next/navigation";

export default async function LeafPage({ params, searchParams }: { params: Promise<{ leafSlug: string }>; searchParams: Promise<{ pagina?: string; cursor?: string }> }) {
  await connection();
  const { leafSlug } = await params;
  if (!isLeafSlug(leafSlug)) notFound();
  const leaf = findLeafBySlug(leafSlug);
  if (leaf === null) notFound();
  const paramsForPage = await searchParams;
  const page = await listPublicAffiliateProductPages({ departmentSlug: leaf.departmentSlug, leafSlug, pageNumber: paramsForPage.pagina, startingCursor: paramsForPage.cursor });
  const nextHref = page.hasNextPage ? createCatalogPaginationHref({ pathname: `/folha/${leafSlug}`, pageNumber: page.pageNumber < 10 ? page.pageNumber + 1 : 1, startingCursor: page.pageNumber < 10 ? page.startingCursor : page.nextCursor }) : null;
  const previousHref = page.pageNumber > 1 ? createCatalogPaginationHref({ pathname: `/folha/${leafSlug}`, pageNumber: page.pageNumber - 1, startingCursor: page.startingCursor }) : null;
  return <CatalogShell><CatalogListing eyebrow="Folha" title={leaf.label} description={leaf.description} products={page.items} nextHref={nextHref} nextLabel={page.pageNumber === 10 ? "Proxima janela" : undefined} previousHref={previousHref} /></CatalogShell>;
}
