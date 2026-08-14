"use client";

import Link from "next/link";

import { listDepartments, type DepartmentSlug } from "@/shared/config/affiliate-taxonomy";

import { useDepartmentNavigation } from "./department-navigation-context";
import { DepartmentRailDivider } from "./department-rail-divider";

export function DepartmentRail(): React.JSX.Element {
  const { panel, openDepartment } = useDepartmentNavigation();

  return (
    <div className="department-rail-wrap" data-sheet-background>
      <nav className="department-rail" aria-label="Departamentos">
        {listDepartments().map((department) => {
          if (department.slug === "home") {
            return (
              <Link key={department.slug} className="department-trigger" href="/">
                {department.label}
              </Link>
            );
          }

          const isActive = panel?.type === "department" && panel.departmentSlug === department.slug;
          return (
            <button
              type="button"
              key={department.slug}
              className={`department-trigger ${isActive ? "is-active" : ""}`.trim()}
              aria-expanded={isActive}
              aria-controls="department-sheet"
              onClick={(event) => openDepartment(department.slug as DepartmentSlug, event.currentTarget)}
            >
              {department.label}
            </button>
          );
        })}
      </nav>
      <DepartmentRailDivider />
    </div>
  );
}
