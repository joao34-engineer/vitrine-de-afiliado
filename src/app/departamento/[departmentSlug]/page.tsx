import { listPublicAffiliateProductPages } from "@/entities/affiliate-product/index.server";
import { createCatalogPaginationHref } from "@/features/load-more-products";
import { findDepartmentBySlug, isDepartmentSlug } from "@/shared/config/affiliate-taxonomy";
import { CatalogListing } from "@/views/catalog-listing";
import { CatalogShell } from "@/widgets/catalog-shell";
import { connection } from "next/server";
import { notFound, redirect } from "next/navigation";

export default async function DepartmentPage({ params, searchParams }: { params: Promise<{ departmentSlug: string }>; searchParams: Promise<{ pagina?: string; cursor?: string }> }) {
  await connection();
  const { departmentSlug } = await params;
  if (!isDepartmentSlug(departmentSlug)) notFound();
  if (departmentSlug === "home") redirect("/");
  const department = findDepartmentBySlug(departmentSlug);
  if (department === null) notFound();
  const paramsForPage = await searchParams;
  const page = await listPublicAffiliateProductPages({ departmentSlug, pageNumber: paramsForPage.pagina, startingCursor: paramsForPage.cursor });
  const nextHref = page.hasNextPage ? createCatalogPaginationHref({ pathname: `/departamento/${departmentSlug}`, pageNumber: page.pageNumber < 10 ? page.pageNumber + 1 : 1, startingCursor: page.pageNumber < 10 ? page.startingCursor : page.nextCursor }) : null;
  const previousHref = page.pageNumber > 1 ? createCatalogPaginationHref({ pathname: `/departamento/${departmentSlug}`, pageNumber: page.pageNumber - 1, startingCursor: page.startingCursor }) : null;
  return <CatalogShell><CatalogListing eyebrow="Departamento" title={department.label} description={department.description} products={page.items} nextHref={nextHref} nextLabel={page.pageNumber === 10 ? "Proxima janela" : undefined} previousHref={previousHref} /></CatalogShell>;
}
