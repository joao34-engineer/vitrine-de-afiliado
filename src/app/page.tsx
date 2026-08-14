import { listPublicAffiliateProductPages } from "@/entities/affiliate-product/index.server";
import { createCatalogPaginationHref } from "@/features/load-more-products";
import { CatalogHome } from "@/views/catalog-home";
import { CatalogShell } from "@/widgets/catalog-shell";
import { connection } from "next/server";

export default async function Home({ searchParams }: { searchParams: Promise<{ pagina?: string; cursor?: string }> }) {
  await connection();
  const params = await searchParams;
  const page = await listPublicAffiliateProductPages({ pageNumber: params.pagina, startingCursor: params.cursor });
  const nextHref = page.hasNextPage
    ? createCatalogPaginationHref({ pathname: "/", pageNumber: page.pageNumber < 10 ? page.pageNumber + 1 : 1, startingCursor: page.pageNumber < 10 ? page.startingCursor : page.nextCursor })
    : null;
  const previousHref = page.pageNumber > 1
    ? createCatalogPaginationHref({ pathname: "/", pageNumber: page.pageNumber - 1, startingCursor: page.startingCursor })
    : null;
  return <CatalogShell mobileRail="header"><CatalogHome products={page.items} nextHref={nextHref} nextLabel={page.pageNumber === 10 ? "Proxima janela" : undefined} previousHref={previousHref} /></CatalogShell>;
}
