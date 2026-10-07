"use client";

import Link from "next/link";

import { listDepartments, type DepartmentSlug } from "@/shared/config/affiliate-taxonomy";
import { findLeafBySlug } from "@/shared/config/affiliate-taxonomy";
import { usePathname } from "next/navigation";

import { useDepartmentNavigation } from "./department-navigation-context";
import { DepartmentRailDivider } from "./department-rail-divider";

export function DepartmentRail({ className = "" }: Readonly<{ className?: string }>): React.JSX.Element {
  const { panel, openDepartment, close } = useDepartmentNavigation();
  const pathname = usePathname();

  const routeSlug = pathname === "/"
    ? "home"
    : pathname.startsWith("/departamento/")
      ? pathname.split("/")[2]
      : pathname.startsWith("/folha/")
        ? findLeafBySlug(pathname.split("/")[2])?.departmentSlug
        : null;
  const selectedSlug = panel?.type === "department" ? panel.departmentSlug : routeSlug;

  return (
    <div
      className={`department-rail-wrap ${className}`.trim()}
      onClick={(event) => event.stopPropagation()}
    >
      <nav className="department-rail" aria-label="Departamentos">
        {listDepartments().map((department) => {
          if (department.slug === "home") {
            return (
              <Link
                key={department.slug}
                className={`department-trigger ${selectedSlug === "home" ? "is-active" : ""}`.trim()}
                href="/"
                onClick={() => {
                  if (panel !== null) close();
                }}
              >
                {department.label}
                <span className="department-trigger-underline" aria-hidden="true" />
              </Link>
            );
          }

          const isSelected = selectedSlug === department.slug;
          const isExpanded = panel?.type === "department" && panel.departmentSlug === department.slug;
          return (
            <button
              type="button"
              key={department.slug}
              className={`department-trigger ${isSelected ? "is-active" : ""}`.trim()}
              aria-expanded={isExpanded}
              aria-controls="department-sheet"
              onClick={(event) => openDepartment(department.slug as DepartmentSlug, event.currentTarget)}
            >
              {department.label}
              <span className="department-trigger-underline" aria-hidden="true" />
            </button>
          );
        })}
      </nav>
      <DepartmentRailDivider />
    </div>
  );
}
