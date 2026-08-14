"use server";

import { listPublicAffiliateProductPages, searchPublicAffiliateProductPages } from "@/entities/affiliate-product/index.server";
import {
  isDepartmentLeafPair,
  isDepartmentSlug,
  isLeafSlug,
  listLeaves,
  type DepartmentSlug,
  type LeafSlug,
} from "@/shared/config/affiliate-taxonomy";

import { createCatalogPaginationHref } from "../model/catalog-pagination-links";

type LoadMoreResult = {
  readonly items: Awaited<ReturnType<typeof listPublicAffiliateProductPages>>["items"];
  readonly nextHref: string | null;
  readonly nextLabel: string;
};

function parseRelativeHref(href: string): URL {
  if (!href.startsWith("/") || href.length > 2048) {
    throw new Error("Invalid catalog pagination link.");
  }
  return new URL(href, "https://catalog.internal");
}

function readTaxonomyFilters(url: URL): { readonly departmentSlug?: DepartmentSlug; readonly leafSlug?: LeafSlug } {
  const departmentSlug = url.searchParams.get("departmentSlug") ?? undefined;
  const leafSlug = url.searchParams.get("leafSlug") ?? undefined;

  if (
    (departmentSlug !== undefined && !isDepartmentSlug(departmentSlug)) ||
    (leafSlug !== undefined && !isLeafSlug(leafSlug)) ||
    (departmentSlug !== undefined && leafSlug !== undefined && !isDepartmentLeafPair(departmentSlug, leafSlug))
  ) {
    throw new Error("Invalid catalog taxonomy filter.");
  }

  return {
    departmentSlug: departmentSlug as DepartmentSlug | undefined,
    leafSlug: leafSlug as LeafSlug | undefined,
  };
}

export async function loadMoreCatalogProducts(href: string): Promise<LoadMoreResult> {
  const url = parseRelativeHref(href);
  const pageNumber = url.searchParams.get("pagina") ?? undefined;
  const startingCursor = url.searchParams.get("cursor") ?? undefined;
  const queryFilters = readTaxonomyFilters(url);
  let filters = queryFilters;

  if (url.pathname.startsWith("/departamento/")) {
    const departmentSlug = url.pathname.split("/")[2];
    if (!isDepartmentSlug(departmentSlug) || departmentSlug === "home") {
      throw new Error("Invalid department pagination link.");
    }
    if (queryFilters.departmentSlug !== undefined && queryFilters.departmentSlug !== departmentSlug) {
      throw new Error("Mismatched department pagination filter.");
    }
    if (queryFilters.leafSlug !== undefined) {
      throw new Error("A department link cannot carry a leaf filter.");
    }
    filters = { departmentSlug };
  } else if (url.pathname.startsWith("/folha/")) {
    const leafSlug = url.pathname.split("/")[2];
    if (!isLeafSlug(leafSlug)) {
      throw new Error("Invalid leaf pagination link.");
    }
    if (queryFilters.leafSlug !== undefined && queryFilters.leafSlug !== leafSlug) {
      throw new Error("Mismatched leaf pagination filter.");
    }
    const leaf = listLeaves().find((candidate) => candidate.slug === leafSlug);
    if (!leaf) throw new Error("Invalid leaf pagination link.");
    if (queryFilters.departmentSlug !== undefined && queryFilters.departmentSlug !== leaf.departmentSlug) {
      throw new Error("Mismatched leaf department filter.");
    }
    filters = { departmentSlug: leaf.departmentSlug, leafSlug };
  } else if (url.pathname !== "/" && url.pathname !== "/buscar") {
    throw new Error("Invalid catalog pagination link.");
  }

  const page = url.pathname === "/buscar"
    ? await searchPublicAffiliateProductPages({
        query: url.searchParams.get("q") ?? "",
        departmentSlug: filters.departmentSlug,
        leafSlug: filters.leafSlug,
        pageNumber,
        startingCursor,
      })
    : await listPublicAffiliateProductPages({
        departmentSlug: filters.departmentSlug,
        leafSlug: filters.leafSlug,
        pageNumber,
        startingCursor,
      });

  const nextHref = page.hasNextPage
    ? createCatalogPaginationHref({
        pathname: url.pathname,
        params: Object.fromEntries(url.searchParams.entries()),
        pageNumber: page.pageNumber < 10 ? page.pageNumber + 1 : 1,
        startingCursor: page.pageNumber < 10 ? page.startingCursor : page.nextCursor,
      })
    : null;

  return {
    items: page.items,
    nextHref,
    nextLabel: page.pageNumber === 10 ? "Proxima janela" : "Carregar mais",
  };
}
