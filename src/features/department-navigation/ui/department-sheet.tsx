"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

import {
  findDepartmentBySlug,
  listDepartments,
  listLeaves,
  type DepartmentSlug,
} from "@/shared/config/affiliate-taxonomy";

import { useBottomSheetDismiss } from "../lib/use-bottom-sheet-dismiss";
import { useDepartmentNavigation, type DepartmentNavigationPanel } from "./department-navigation-context";

const FOCUSABLE_SELECTOR = "a[href],button:not([disabled]),input:not([disabled]),[tabindex]:not([tabindex='-1'])";

type SheetEntry =
  | { readonly type: "department"; readonly slug: DepartmentSlug; readonly label: string }
  | { readonly type: "link"; readonly slug: string; readonly label: string; readonly href: string }
  | { readonly type: "leaf"; readonly slug: string; readonly label: string; readonly href: string };

function getAllSheetEntries(): readonly SheetEntry[] {
  const homeEntry: SheetEntry = { type: "link", slug: "home", label: "Home", href: "/" };
  const entries = listDepartments().flatMap<SheetEntry>((department): readonly SheetEntry[] => {
    if (department.slug === "mais") {
      return listLeaves()
        .filter((leaf) => leaf.departmentSlug === "mais")
        .map((leaf) => ({ type: "leaf" as const, slug: leaf.slug, label: leaf.label, href: `/folha/${leaf.slug}` }));
    }

    if (department.slug === "home") return [];
    return [{ type: "department" as const, slug: department.slug, label: department.label }];
  });
  return [homeEntry, ...entries];
}

function useSheetAccessibility(
  sheetRef: React.RefObject<HTMLElement | null>,
  onClose: () => void,
  triggerRef: React.RefObject<HTMLButtonElement | null>,
  panelKey: string,
): void {
  useEffect(() => {
    const triggerElement = triggerRef.current;
    const backgroundElements = Array.from(document.querySelectorAll<HTMLElement>("[data-sheet-background]"));
    backgroundElements.forEach((element) => {
      element.inert = true;
      element.setAttribute("aria-hidden", "true");
    });

    const focusInitial = () => {
      const initialFocus = sheetRef.current?.querySelector<HTMLElement>('[data-sheet-initial-focus="true"]');
      const focusable = sheetRef.current?.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
      (initialFocus ?? focusable)?.focus();
    };
    focusInitial();

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
  }, [onClose, panelKey, sheetRef, triggerRef]);
}

function SheetRow({ href, label, onClose }: Readonly<{ href: string; label: string; onClose: () => void }>): React.JSX.Element {
  return <Link href={href} className="sheet-leaf" onClick={onClose}><span>{label}</span><span aria-hidden="true">›</span></Link>;
}

function SheetSearch({ label, placeholder, query, onQueryChange }: Readonly<{
  label: string;
  placeholder: string;
  query: string;
  onQueryChange: (value: string) => void;
}>): React.JSX.Element {
  return (
    <label className="sheet-search">
      <span aria-hidden="true" className="sheet-search-icon">⌕</span>
      <span className="sr-only">{label}</span>
      <input data-sheet-initial-focus="true" value={query} onChange={(event) => onQueryChange(event.target.value)} placeholder={placeholder} />
    </label>
  );
}

function AllDepartmentsSheet({ onClose, openDepartment }: Readonly<{
  onClose: () => void;
  openDepartment: (departmentSlug: DepartmentSlug) => void;
}>): React.JSX.Element {
  const [query, setQuery] = useState("");
  const entries = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("pt-BR");
    if (normalizedQuery.length === 0) return getAllSheetEntries();
    return getAllSheetEntries().filter((entry) => entry.label.toLocaleLowerCase("pt-BR").includes(normalizedQuery));
  }, [query]);

  return (
    <>
      <div className="sheet-static-header">
        <h2 id="department-sheet-title">Todos os departamentos</h2>
        <SheetSearch label="Buscar departamento" placeholder="Buscar departamento" query={query} onQueryChange={setQuery} />
      </div>
      <nav className="sheet-scroll-region" aria-label="Todos os departamentos">
        {entries.map((entry) => entry.type === "leaf" || entry.type === "link"
          ? <SheetRow key={`${entry.type}-${entry.slug}`} href={entry.href} label={entry.label} onClose={onClose} />
          : <button key={`${entry.type}-${entry.slug}`} type="button" className="sheet-leaf" onClick={() => openDepartment(entry.slug)}><span>{entry.label}</span><span aria-hidden="true">›</span></button>)}
        {entries.length === 0 ? <p className="sheet-empty">Nenhum departamento encontrado.</p> : null}
      </nav>
    </>
  );
}

function DepartmentLeavesSheet({ departmentSlug, onClose }: Readonly<{ departmentSlug: DepartmentSlug; onClose: () => void }>): React.JSX.Element {
  const department = findDepartmentBySlug(departmentSlug);
  const leaves = listLeaves().filter((leaf) => leaf.departmentSlug === departmentSlug);
  const [query, setQuery] = useState("");
  const normalizedQuery = query.trim().toLocaleLowerCase("pt-BR");
  const filteredLeaves = normalizedQuery.length === 0
    ? leaves
    : leaves.filter((leaf) => leaf.label.toLocaleLowerCase("pt-BR").includes(normalizedQuery));

  return (
    <>
      <div className="sheet-static-header">
        <h2 id="department-sheet-title">{department?.label ?? departmentSlug}</h2>
        <SheetSearch label={`Buscar em ${department?.label ?? departmentSlug}`} placeholder="Buscar folhas" query={query} onQueryChange={setQuery} />
      </div>
      <nav className="sheet-scroll-region" aria-label={`Folhas de ${department?.label ?? departmentSlug}`}>
        <SheetRow href={`/departamento/${departmentSlug}`} label="Todos" onClose={onClose} />
        {filteredLeaves.map((leaf) => <SheetRow key={leaf.slug} href={`/folha/${leaf.slug}`} label={leaf.label} onClose={onClose} />)}
        {filteredLeaves.length === 0 ? <p className="sheet-empty">Nenhuma folha encontrada.</p> : null}
      </nav>
    </>
  );
}

function OpenDepartmentSheet({ panel, close, triggerRef }: Readonly<{
  panel: Exclude<DepartmentNavigationPanel, null>;
  close: () => void;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
}>): React.JSX.Element {
  const sheetRef = useRef<HTMLElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const scrollRegionRef = useRef<HTMLElement>(null);
  const { openDepartment } = useDepartmentNavigation();

  useSheetAccessibility(sheetRef, close, triggerRef, panel.type === "all" ? "all" : panel.departmentSlug);
  useBottomSheetDismiss({ sheetRef, scrollRegionRef, backdropRef, onClose: close });

  return (
    <div ref={backdropRef} className="sheet-backdrop" role="presentation" onClick={(event) => { if (event.target === event.currentTarget) close(); }}>
      <aside
        ref={sheetRef}
        className="department-sheet"
        id="department-sheet"
        aria-labelledby="department-sheet-title"
        role="dialog"
        aria-modal="true"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="sheet-handle" aria-hidden="true" />
        {panel.type === "all" ? (
          <AllDepartmentsSheet onClose={close} openDepartment={(departmentSlug) => openDepartment(departmentSlug, null)} />
        ) : (
          <DepartmentLeavesSheet departmentSlug={panel.departmentSlug} onClose={close} />
        )}
      </aside>
    </div>
  );
}

export function DepartmentSheet(): React.JSX.Element | null {
  const { panel, close, triggerRef } = useDepartmentNavigation();
  if (panel === null) return null;
  return <OpenDepartmentSheet panel={panel} close={close} triggerRef={triggerRef} />;
}
