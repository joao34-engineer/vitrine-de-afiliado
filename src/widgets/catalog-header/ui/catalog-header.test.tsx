import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/image", () => ({ default: () => <span /> }));
vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => <a href={href} {...props}>{children}</a>,
}));
vi.mock("next/navigation", () => ({ usePathname: () => "/" }));
vi.mock("@/features/department-navigation", () => ({
  DepartmentMenuButton: () => <button type="button">Menu</button>,
  DepartmentRail: () => <nav aria-label="Departamentos" />,
}));
vi.mock("@/features/theme-toggle", () => ({ ThemeToggle: () => <button type="button">Tema</button> }));

import { CatalogHeader } from "./catalog-header";

describe("catalog header search", () => {
  it("submits the desktop search from the visible icon", () => {
    render(<CatalogHeader />);

    const form = document.querySelector("form.header-search-form");
    expect(form?.getAttribute("action")).toBe("/buscar");
    expect(form?.getAttribute("method")).toBe("get");
    expect(screen.getAllByRole("button", { name: "Buscar produtos" })[0]?.getAttribute("type")).toBe("submit");
  });
});
