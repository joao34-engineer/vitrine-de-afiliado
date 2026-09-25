import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => <a href={href} {...props}>{children}</a>,
}));
vi.mock("@/features/department-navigation", () => ({
  DepartmentMenuButton: () => <button type="button">Filtros</button>,
  DepartmentRail: () => <nav aria-label="Departamentos" />,
}));
vi.mock("@/widgets/catalog-product-grid", () => ({
  CatalogProductGrid: () => <div>grid</div>,
}));

import { CatalogListing } from "./catalog-listing";

describe("catalog listing desktop sidebar", () => {
  it("lists taxonomy leaves without fetching", () => {
    render(
      <CatalogListing
        eyebrow="Casa"
        title="Casa que resolve"
        description="Achados para organizar."
        products={[]}
        nextHref={null}
        departmentSlug="casa"
      />,
    );

    expect(screen.getByRole("complementary", { name: "Folhas de Casa" })).toBeTruthy();
    expect(screen.getByText("Categorias de Casa")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Todos" }).getAttribute("href")).toBe("/departamento/casa");
    expect(screen.getByRole("link", { name: "Decoracao" }).getAttribute("href")).toBe("/folha/decoracao");
    expect(screen.getByRole("link", { name: "Organizacao" }).getAttribute("href")).toBe("/folha/organizacao");
  });

  it("marks the current leaf as the context chip", () => {
    render(
      <CatalogListing
        eyebrow="Casa"
        title="Organizacao"
        description="Achados para organizar."
        products={[]}
        nextHref={null}
        departmentSlug="casa"
        leafSlug="organizacao"
      />,
    );

    expect(screen.getByRole("link", { name: "Organizacao" }).className).toContain("is-active");
    expect(screen.getByRole("link", { name: "Todos" }).className).not.toContain("is-active");
  });
});
