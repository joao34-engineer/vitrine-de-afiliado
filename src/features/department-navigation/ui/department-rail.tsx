"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { listDepartments, listLeaves, type DepartmentSlug } from "@/shared/config/affiliate-taxonomy";

import { DepartmentRailDivider } from "./department-rail-divider";

const FOCUSABLE_SELECTOR = "a[href],button:not([disabled]),[tabindex]:not([tabindex='-1'])";

function DepartmentSheet({
  departmentSlug,
  onClose,
  triggerRef,
}: Readonly<{
  departmentSlug: DepartmentSlug;
  onClose: () => void;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
}>): React.JSX.Element {
  const department = listDepartments().find((item) => item.slug === departmentSlug);
  const leaves = listLeaves().filter((item) => item.departmentSlug === departmentSlug);
  const sheetRef = useRef<HTMLElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const triggerElement = triggerRef.current;
    closeButtonRef.current?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== "Tab") return;
      const focusable = sheetRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
      if (!focusable || focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      triggerElement?.focus();
    };
  }, [onClose, triggerRef]);

  return (
    <div className="sheet-backdrop" role="presentation" onClick={onClose}>
      <aside
        ref={sheetRef}
        className="department-sheet"
        aria-labelledby="department-sheet-title"
        role="dialog"
        aria-modal="true"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="sheet-heading">
          <div>
            <p className="eyebrow">Departamento</p>
            <h2 id="department-sheet-title">{department?.label ?? departmentSlug}</h2>
          </div>
          <button ref={closeButtonRef} type="button" className="icon-button" aria-label="Fechar menu" onClick={onClose}>X</button>
        </div>
        <p className="sheet-description">{department?.description}</p>
        <nav className="sheet-leaves" aria-label="Folhas do departamento">
          <Link href={`/departamento/${departmentSlug}`} onClick={onClose} className="sheet-leaf sheet-leaf-all">Todos</Link>
          {leaves.map((leaf) => (
            <Link key={leaf.slug} href={`/folha/${leaf.slug}`} onClick={onClose} className="sheet-leaf">
              <span>{leaf.label}</span><span aria-hidden="true">-&gt;</span>
            </Link>
          ))}
        </nav>
      </aside>
    </div>
  );
}

export function DepartmentRail(): React.JSX.Element {
  const [openDepartment, setOpenDepartment] = useState<DepartmentSlug | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  return (
    <div className="department-rail-wrap">
      <nav className="department-rail" aria-label="Departamentos">
        {listDepartments().map((department) => department.slug === "home" ? (
          <Link key={department.slug} className="department-trigger" href="/">{department.label}</Link>
        ) : (
          <button
            ref={openDepartment === department.slug ? triggerRef : undefined}
            type="button"
            key={department.slug}
            className={`department-trigger ${openDepartment === department.slug ? "is-active" : ""}`}
            aria-expanded={openDepartment === department.slug}
            onClick={(event) => {
              triggerRef.current = event.currentTarget;
              setOpenDepartment(department.slug);
            }}
          >
            {department.label}
          </button>
        ))}
      </nav>
      <DepartmentRailDivider />
      {openDepartment !== null ? <DepartmentSheet departmentSlug={openDepartment} onClose={() => setOpenDepartment(null)} triggerRef={triggerRef} /> : null}
    </div>
  );
}
