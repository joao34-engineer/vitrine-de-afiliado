import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => <a href={href} {...props}>{children}</a>,
}));
vi.mock("./department-rail-divider", () => ({
  DepartmentRailDivider: () => <span aria-hidden="true" />,
}));

import { DepartmentRail } from "./department-rail";

describe("department rail sheet", () => {
  afterEach(() => {
    document.querySelector("main[data-sheet-background]")?.remove();
  });

  it("opens without fetching, traps focus and restores the trigger", () => {
    const background = document.createElement("main");
    background.dataset.sheetBackground = "true";
    document.body.append(background);
    render(<DepartmentRail />);
    const trigger = screen.getByRole("button", { name: "Homens" });

    fireEvent.click(trigger);
    expect(screen.getByRole("dialog").getAttribute("aria-modal")).toBe("true");
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Fechar menu" }));
    expect(document.querySelector("main")?.getAttribute("aria-hidden")).toBe("true");
    expect((document.querySelector("main") as HTMLElement).inert).toBe(true);
    expect(document.querySelector(".department-rail-wrap [data-sheet-background]")?.getAttribute("aria-hidden")).toBe("true");
    expect((document.querySelector(".department-rail-wrap [data-sheet-background]") as HTMLElement).inert).toBe(true);

    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });

  it("wraps Tab navigation inside the sheet", () => {
    render(<DepartmentRail />);
    fireEvent.click(screen.getByRole("button", { name: "Homens" }));

    const closeButton = screen.getByRole("button", { name: "Fechar menu" });
    const links = screen.getAllByRole("link");
    const lastLink = links[links.length - 1];
    lastLink?.focus();
    fireEvent.keyDown(document, { key: "Tab" });
    expect(document.activeElement).toBe(closeButton);

    closeButton.focus();
    fireEvent.keyDown(document, { key: "Tab", shiftKey: true });
    expect(document.activeElement).toBe(lastLink);
  });

  it("keeps home as a direct link", () => {
    render(<DepartmentRail />);
    expect(screen.getByRole("link", { name: "Home" }).getAttribute("href")).toBe("/");
  });
});
