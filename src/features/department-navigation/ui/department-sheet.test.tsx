import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => <a href={href} {...props}>{children}</a>,
}));

import { DepartmentMenuButton } from "./department-menu-button";
import { DepartmentNavigationProvider } from "./department-navigation-context";
import { DepartmentSheet } from "./department-sheet";

describe("department sheet geral", () => {
  it("exibe as folhas de Mais sem uma linha de departamento Mais", () => {
    render(
      <DepartmentNavigationProvider>
        <DepartmentMenuButton />
        <DepartmentSheet />
      </DepartmentNavigationProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Abrir menu de departamentos" }));

    const dialog = within(screen.getByRole("dialog"));
    expect(dialog.queryByText("Mais")).toBeNull();
    expect(dialog.getByText("Papelaria")).toBeTruthy();
    expect(dialog.getByText("Ferramentas")).toBeTruthy();
    expect(dialog.getByText("Automotivo")).toBeTruthy();
    expect(dialog.getByText("Achadinhos gerais")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Abrir menu de departamentos" }).getAttribute("aria-expanded")).toBe("true");
  });
});
