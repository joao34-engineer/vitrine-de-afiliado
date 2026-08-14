"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

import {
  findDepartmentBySlug,
  listDepartments,
  listLeaves,
  type DepartmentSlug,
} from "@/shared/config/affiliate-taxonomy";

import { useDepartmentNavigation, type DepartmentNavigationPanel } from "./department-navigation-context";

const FOCUSABLE_SELECTOR = "a[href],button:not([disabled]),input:not([disabled]),[tabindex]:not([tabindex='-1'])";

type SheetEntry =
  | { readonly type: "department"; readonly slug: DepartmentSlug; readonly label: string; readonly href: string }
  | { readonly type: "leaf"; readonly slug: string; readonly label: string; readonly href: string };

function getAllSheetEntries(): readonly SheetEntry[] {
  return listDepartments().flatMap<SheetEntry>((department): readonly SheetEntry[] => {
    if (department.slug === "mais") {
      return listLeaves()
        .filter((leaf) => leaf.departmentSlug === "mais")
        .map((leaf) => ({ type: "leaf" as const, slug: leaf.slug, label: leaf.label, href: `/folha/${leaf.slug}` }));
    }

    return [{ type: "department" as const, slug: department.slug, label: department.label, href: department.slug === "home" ? "/" : `/departamento/${department.slug}` }];
  });
}

function useSheetAccessibility(sheetRef: React.RefObject<HTMLElement | null>, onClose: () => void, triggerRef: React.RefObject<HTMLButtonElement | null>): void {
  useEffect(() => {
    const triggerElement = triggerRef.current;
    const backgroundElements = Array.from(document.querySelectorAll<HTMLElement>("[data-sheet-background]"));
    backgroundElements.forEach((element) => {
      element.inert = true;
      element.setAttribute("aria-hidden", "true");
    });

    const focusable = sheetRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
    const initialFocus = sheetRef.current?.querySelector<HTMLElement>('[data-sheet-initial-focus="true"]');
    (initialFocus ?? focusable?.[0])?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== "Tab") return;

      const elements = sheetRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
      if (!elements || elements.length === 0) return;
      const first = elements[0];
      const last = elements[elements.length - 1];
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
      backgroundElements.forEach((element) => {
        element.inert = false;
        element.removeAttribute("aria-hidden");
      });
      triggerElement?.focus();
    };
  }, [onClose, sheetRef, triggerRef]);
}

function SheetRow({ href, label, onClose }: Readonly<{ href: string; label: string; onClose: () => void }>): React.JSX.Element {
  return (
    <Link href={href} className="sheet-leaf" onClick={onClose}>
      <span>{label}</span>
      <span aria-hidden="true">›</span>
    </Link>
  );
}

function AllDepartmentsSheet({ onClose }: Readonly<{ onClose: () => void }>): React.JSX.Element {
  const [query, setQuery] = useState("");
  const entries = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("pt-BR");
    if (normalizedQuery.length === 0) return getAllSheetEntries();
    return getAllSheetEntries().filter((entry) => entry.label.toLocaleLowerCase("pt-BR").includes(normalizedQuery));
  }, [query]);

  return (
    <>
      <p className="sheet-eyebrow">Navegacao</p>
      <h2 id="department-sheet-title">Todos os departamentos</h2>
      <label className="sheet-search">
        <span aria-hidden="true">⌕</span>
        <span className="sr-only">Buscar departamento</span>
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar departamento" />
      </label>
      <nav className="sheet-leaves" aria-label="Todos os departamentos">
        {entries.map((entry) => <SheetRow key={`${entry.type}-${entry.slug}`} href={entry.href} label={entry.label} onClose={onClose} />)}
        {entries.length === 0 ? <p className="sheet-empty">Nenhum departamento encontrado.</p> : null}
      </nav>
    </>
  );
}

function DepartmentLeavesSheet({ departmentSlug, onClose }: Readonly<{ departmentSlug: DepartmentSlug; onClose: () => void }>): React.JSX.Element {
  const department = findDepartmentBySlug(departmentSlug);
  const leaves = listLeaves().filter((leaf) => leaf.departmentSlug === departmentSlug);

  return (
    <>
      <p className="sheet-eyebrow">Departamento</p>
      <h2 id="department-sheet-title">{department?.label ?? departmentSlug}</h2>
      <p id="department-sheet-description" className="sheet-description">{department?.description}</p>
      <nav className="sheet-leaves" aria-label={`Folhas de ${department?.label ?? departmentSlug}`}>
        <SheetRow href={`/departamento/${departmentSlug}`} label="Todos" onClose={onClose} />
        {leaves.map((leaf) => <SheetRow key={leaf.slug} href={`/folha/${leaf.slug}`} label={leaf.label} onClose={onClose} />)}
      </nav>
    </>
  );
}

function SheetContents({ panel, onClose }: Readonly<{ panel: Exclude<DepartmentNavigationPanel, null>; onClose: () => void }>): React.JSX.Element {
  if (panel.type === "all") return <AllDepartmentsSheet onClose={onClose} />;
  return <DepartmentLeavesSheet departmentSlug={panel.departmentSlug} onClose={onClose} />;
}

function OpenDepartmentSheet({ panel, close, triggerRef }: Readonly<{
  panel: Exclude<DepartmentNavigationPanel, null>;
  close: () => void;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
}>): React.JSX.Element {
  const sheetRef = useRef<HTMLElement>(null);

  useSheetAccessibility(sheetRef, close, triggerRef);

  return (
    <div className="sheet-backdrop" role="presentation" onClick={close}>
      <aside
        ref={sheetRef}
        className="department-sheet"
        id="department-sheet"
        aria-labelledby="department-sheet-title"
        aria-describedby={panel.type === "department" ? "department-sheet-description" : undefined}
        role="dialog"
        aria-modal="true"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="sheet-handle" aria-hidden="true" />
        <div className="sheet-heading">
          <span className="sheet-brand-mark" aria-hidden="true">S</span>
          <button type="button" className="icon-button" aria-label="Fechar menu" aria-controls="department-sheet" data-sheet-initial-focus="true" onClick={close}>X</button>
        </div>
        <SheetContents panel={panel} onClose={close} />
      </aside>
    </div>
  );
}

export function DepartmentSheet(): React.JSX.Element | null {
  const { panel, close, triggerRef } = useDepartmentNavigation();
  if (panel === null) return null;
  return <OpenDepartmentSheet panel={panel} close={close} triggerRef={triggerRef} />;
}
