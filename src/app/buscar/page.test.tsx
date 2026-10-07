import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { searchPublicAffiliateProductPages, PublicAffiliateProductCatalogError } = vi.hoisted(() => {
  class PublicAffiliateProductCatalogError extends Error {
    readonly code: string;

    constructor(code: string, message: string) {
      super(message);
      this.name = "PublicAffiliateProductCatalogError";
      this.code = code;
    }
  }

  return {
    PublicAffiliateProductCatalogError,
    searchPublicAffiliateProductPages: vi.fn(),
  };
});

vi.mock("server-only", () => ({}));
vi.mock("next/server", () => ({ connection: vi.fn() }));
vi.mock("next/navigation", () => ({ notFound: vi.fn() }));
vi.mock("@/widgets/catalog-shell", () => ({
  CatalogShell: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
vi.mock("@/entities/affiliate-product/index.server", () => ({
  PublicAffiliateProductCatalogError,
  searchPublicAffiliateProductPages,
}));
vi.mock("@/features/load-more-products", () => ({
  createCatalogPaginationHref: () => "/buscar?q=fone&pagina=2",
}));
vi.mock("@/features/catalog-search", () => ({
  SearchResultGrid: () => <div>resultados</div>,
}));

import SearchPage from "./page";

describe("search page", () => {
  beforeEach(() => {
    searchPublicAffiliateProductPages.mockReset();
  });

  it("renders a friendly empty state for a short query", async () => {
    searchPublicAffiliateProductPages.mockRejectedValue(
      new PublicAffiliateProductCatalogError("invalid-filter", "Search query must contain between 2 and 120 characters."),
    );

    render(await SearchPage({ searchParams: Promise.resolve({ q: "a" }) }));

    expect(screen.getByRole("heading", { name: "Busca muito curta" })).toBeTruthy();
  });

  it("does not swallow catalog query failures", async () => {
    searchPublicAffiliateProductPages.mockRejectedValue(
      new PublicAffiliateProductCatalogError("query-failed", "rpc down"),
    );

    await expect(SearchPage({ searchParams: Promise.resolve({ q: "fone" }) })).rejects.toMatchObject({
      code: "query-failed",
    });
  });
});
