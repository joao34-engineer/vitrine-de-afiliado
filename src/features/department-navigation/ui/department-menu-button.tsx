"use client";

import { useDepartmentNavigation } from "./department-navigation-context";

export function DepartmentMenuButton({ className = "", label }: Readonly<{ className?: string; label?: string }>): React.JSX.Element {
  const { panel, openAll } = useDepartmentNavigation();

  return (
    <button
      type="button"
      className={`department-menu-button ${className}`.trim()}
      aria-label={label ?? "Abrir menu de departamentos"}
      aria-controls="department-sheet"
      aria-expanded={panel?.type === "all"}
      onClick={(event) => openAll(event.currentTarget)}
    >
      <span aria-hidden={label === undefined}>{label ?? "≡"}</span>
    </button>
  );
}
