import { fireEvent, render, screen, within } from "@testing-library/react";
import { useEffect } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => <a href={href} {...props}>{children}</a>,
}));
vi.mock("@/shared/lib/gsap-client", () => ({
  gsap: {
    set: vi.fn(),
    to: vi.fn(() => ({})),
    killTweensOf: vi.fn(),
    timeline: vi.fn(() => ({
      to: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      kill: vi.fn(),
    })),
  },
  useGSAP: vi.fn((callback: (context: unknown, contextSafe: <T extends (...args: never[]) => unknown>(fn: T) => T) => void) => {
    useEffect(() => callback({}, (fn) => fn), [callback]);
  }),
}));

import { DepartmentMenuButton } from "./department-menu-button";
import { DepartmentNavigationProvider } from "./department-navigation-context";
import { DepartmentSheet } from "./department-sheet";

describe("department sheet geral", () => {
  beforeEach(() => {
    vi.stubGlobal("matchMedia", vi.fn(() => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() })));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

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
    expect(dialog.queryByText("Home")).toBeNull();
    expect(dialog.getByText("Papelaria")).toBeTruthy();
    expect(dialog.getByText("Ferramentas")).toBeTruthy();
    expect(dialog.getByText("Automotivo")).toBeTruthy();
    expect(dialog.getByText("Achadinhos gerais")).toBeTruthy();
    expect(document.activeElement).toBe(screen.getByRole("dialog"));
    expect(screen.getByRole("button", { name: "Abrir menu de departamentos" }).getAttribute("aria-expanded")).toBe("true");
  });
});
