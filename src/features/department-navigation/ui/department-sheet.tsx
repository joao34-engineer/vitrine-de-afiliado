"use client";

import Image from "next/image";
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
import { gsap, useGSAP } from "@/shared/lib/gsap-client";

const FOCUSABLE_SELECTOR = "a[href],button:not([disabled]),input:not([disabled]),[tabindex]:not([tabindex='-1'])";

type SheetEntry =
  | { readonly type: "department"; readonly slug: DepartmentSlug; readonly label: string }
  | { readonly type: "link"; readonly slug: string; readonly label: string; readonly href: string }
  | { readonly type: "leaf"; readonly slug: string; readonly label: string; readonly href: string };

function getAllSheetEntries(): readonly SheetEntry[] {
  const entries = listDepartments().flatMap<SheetEntry>((department): readonly SheetEntry[] => {
    if (department.slug === "mais") {
      return listLeaves()
        .filter((leaf) => leaf.departmentSlug === "mais")
        .map((leaf) => ({ type: "leaf" as const, slug: leaf.slug, label: leaf.label, href: `/folha/${leaf.slug}` }));
    }

    if (department.slug === "home") return [];
    return [{ type: "department" as const, slug: department.slug, label: department.label }];
  });
  return entries;
}

function useSheetAccessibility(
  sheetRef: React.RefObject<HTMLElement | null>,
  onClose: () => void,
  triggerRef: React.RefObject<HTMLButtonElement | null>,
): void {
  const closeRef = useRef(onClose);

  useEffect(() => {
    closeRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const triggerElement = triggerRef.current;
    const scrollY = window.scrollY;
    const bodyStyle = document.body.style;
    const previousBodyPosition = bodyStyle.position;
    const previousBodyTop = bodyStyle.top;
    const previousBodyWidth = bodyStyle.width;
    const previousBodyOverflow = bodyStyle.overflow;
    const previousBodyOverscrollBehavior = bodyStyle.overscrollBehavior;

    bodyStyle.position = "fixed";
    bodyStyle.top = `-${scrollY}px`;
    bodyStyle.width = "100%";
    bodyStyle.overflow = "hidden";
    bodyStyle.overscrollBehavior = "none";

    const backgroundElements = Array.from(document.querySelectorAll<HTMLElement>("[data-sheet-background]"));
    backgroundElements.forEach((element) => {
      element.inert = true;
      element.setAttribute("aria-hidden", "true");
    });

    sheetRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeRef.current();
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
      bodyStyle.position = previousBodyPosition;
      bodyStyle.top = previousBodyTop;
      bodyStyle.width = previousBodyWidth;
      bodyStyle.overflow = previousBodyOverflow;
      bodyStyle.overscrollBehavior = previousBodyOverscrollBehavior;
      try {
        window.scrollTo(0, scrollY);
      } catch {
        // jsdom and embedded webviews may not implement scrollTo.
      }
      triggerElement?.focus();
    };
  }, [sheetRef, triggerRef]);
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
      <input type="search" value={query} onChange={(event) => onQueryChange(event.target.value)} placeholder={placeholder} />
    </label>
  );
}

function useDesktopNavigationChrome(): boolean {
  const [isDesktop, setIsDesktop] = useState(() =>
    typeof window !== "undefined" && window.matchMedia("(min-width: 641px)").matches,
  );

  useEffect(() => {
    const media = window.matchMedia("(min-width: 641px)");
    const sync = () => setIsDesktop(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  return isDesktop;
}

function MegaMenuSheet({
  panel,
  onClose,
  openDepartment,
  scrollRegionRef,
}: Readonly<{
  panel: Exclude<DepartmentNavigationPanel, null>;
  onClose: () => void;
  openDepartment: (departmentSlug: DepartmentSlug) => void;
  scrollRegionRef: React.RefObject<HTMLElement | null>;
}>): React.JSX.Element {
  const [query, setQuery] = useState("");
  const activeDepartmentSlug = panel.type === "department" ? panel.departmentSlug : null;
  const activeDepartment = activeDepartmentSlug ? findDepartmentBySlug(activeDepartmentSlug) : null;
  const normalizedQuery = query.trim().toLocaleLowerCase("pt-BR");

  const departments = useMemo(() => {
    const items = listDepartments().filter((department) => department.slug !== "home");
    if (normalizedQuery.length === 0) return items;
    return items.filter((department) => department.label.toLocaleLowerCase("pt-BR").includes(normalizedQuery));
  }, [normalizedQuery]);

  const leaves = useMemo(() => {
    if (activeDepartmentSlug === null) return [];
    const items = listLeaves().filter((leaf) => leaf.departmentSlug === activeDepartmentSlug);
    if (normalizedQuery.length === 0) return items;
    return items.filter((leaf) => leaf.label.toLocaleLowerCase("pt-BR").includes(normalizedQuery));
  }, [activeDepartmentSlug, normalizedQuery]);

  return (
    <div className="sheet-mega-menu">
      <div className="sheet-mega-overview">
        <div className="brand-lockup">
          <span className="brand-mark">
            <Image src="/brand/salvat-brand-seal.png" alt="" width={48} height={48} />
          </span>
          <span>
            <span className="brand-name">salvat&amp;brand</span>
            <span className="brand-subtitle">achados selecionados</span>
          </span>
        </div>
        <p className="sheet-mega-copy">Use o menu para abrir um departamento ou ir direto para uma folha.</p>
        <Link href="/" className="sheet-mega-cta" onClick={onClose}>Ver ofertas</Link>
        <SheetSearch
          label="Buscar departamento ou folha"
          placeholder="Buscar departamento ou folha"
          query={query}
          onQueryChange={setQuery}
        />
      </div>
      <div className="sheet-mega-column">
        <h2 id="department-sheet-title">Departamentos</h2>
        <nav className="sheet-scroll-region" aria-label="Departamentos">
          <SheetRow href="/" label="Home" onClose={onClose} />
          {departments.map((department) => (
            <button
              key={department.slug}
              type="button"
              className={`sheet-leaf ${activeDepartmentSlug === department.slug ? "is-active" : ""}`.trim()}
              onClick={() => openDepartment(department.slug)}
            >
              <span>{department.label}</span>
              <span aria-hidden="true">›</span>
            </button>
          ))}
          {departments.length === 0 ? <p className="sheet-empty">Nenhum departamento encontrado.</p> : null}
        </nav>
      </div>
      <div className="sheet-mega-column">
        <h3>{activeDepartment ? `Folhas de ${activeDepartment.label}` : "Folhas"}</h3>
        <nav ref={scrollRegionRef} className="sheet-scroll-region" aria-label={activeDepartment ? `Folhas de ${activeDepartment.label}` : "Folhas"}>
          {activeDepartmentSlug ? (
            <>
              <SheetRow href={`/departamento/${activeDepartmentSlug}`} label="Todos" onClose={onClose} />
              {leaves.map((leaf) => <SheetRow key={leaf.slug} href={`/folha/${leaf.slug}`} label={leaf.label} onClose={onClose} />)}
              {leaves.length === 0 ? <p className="sheet-empty">Nenhuma folha encontrada.</p> : null}
            </>
          ) : (
            <p className="sheet-empty">Selecione um departamento.</p>
          )}
        </nav>
      </div>
    </div>
  );
}

function AllDepartmentsSheet({ onClose, openDepartment, scrollRegionRef }: Readonly<{
  onClose: () => void;
  openDepartment: (departmentSlug: DepartmentSlug) => void;
  scrollRegionRef: React.RefObject<HTMLElement | null>;
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
        <SheetSearch label="Buscar departamento" placeholder="Buscar departamento" query={query} onQueryChange={setQuery} />
        <h2 id="department-sheet-title">Todos os departamentos</h2>
      </div>
      <nav ref={scrollRegionRef} className="sheet-scroll-region" aria-label="Todos os departamentos">
        {entries.map((entry) => entry.type === "leaf" || entry.type === "link"
          ? <SheetRow key={`${entry.type}-${entry.slug}`} href={entry.href} label={entry.label} onClose={onClose} />
          : <button key={`${entry.type}-${entry.slug}`} type="button" className="sheet-leaf" onClick={() => openDepartment(entry.slug)}><span>{entry.label}</span><span aria-hidden="true">›</span></button>)}
        {entries.length === 0 ? <p className="sheet-empty">Nenhum departamento encontrado.</p> : null}
      </nav>
    </>
  );
}

function DepartmentLeavesSheet({ departmentSlug, onClose, scrollRegionRef }: Readonly<{
  departmentSlug: DepartmentSlug;
  onClose: () => void;
  scrollRegionRef: React.RefObject<HTMLElement | null>;
}>): React.JSX.Element {
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
        <SheetSearch label={`Buscar em ${department?.label ?? departmentSlug}`} placeholder="Buscar folhas" query={query} onQueryChange={setQuery} />
        <h2 id="department-sheet-title">{department?.label ?? departmentSlug}</h2>
      </div>
      <nav ref={scrollRegionRef} className="sheet-scroll-region" aria-label={`Folhas de ${department?.label ?? departmentSlug}`}>
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
  const isDesktop = useDesktopNavigationChrome();

  useSheetAccessibility(sheetRef, close, triggerRef);
  useBottomSheetDismiss({ sheetRef, scrollRegionRef, backdropRef, onClose: close });

  useEffect(() => {
    const scrollRegion = scrollRegionRef.current;
    if (scrollRegion) scrollRegion.scrollTop = 0;
  }, [panel, scrollRegionRef]);

  useGSAP(() => {
    const sheet = sheetRef.current;
    const backdrop = backdropRef.current;
    if (!sheet || !backdrop) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const rows = sheet.querySelectorAll<HTMLElement>(".sheet-leaf");
    const timeline = gsap.timeline();

    if (reduceMotion || !window.matchMedia("(max-width: 640px)").matches) {
      gsap.set(backdrop, { autoAlpha: 1 });
      gsap.set(sheet, { y: 0 });
      return () => timeline.kill();
    }

    gsap.set(backdrop, { autoAlpha: 0 });
    gsap.set(sheet, { y: 18 });
    timeline
      .to(backdrop, { autoAlpha: 1, duration: 0.18, ease: "power2.out" }, 0)
      .to(sheet, { y: 0, duration: 0.28, ease: "power3.out" }, 0)
      .from(rows, { y: 8, autoAlpha: 0, duration: 0.2, stagger: 0.018, ease: "power2.out" }, 0.08);

    return () => timeline.kill();
  }, { scope: sheetRef, dependencies: [panel.type === "all" ? "all" : panel.departmentSlug], revertOnUpdate: true });

  return (
    <div ref={backdropRef} className="sheet-backdrop" role="presentation" onClick={(event) => { if (event.target === event.currentTarget) close(); }}>
      <aside
        ref={sheetRef}
        className={`department-sheet ${!isDesktop && panel.type === "department" ? "department-sheet-compact" : ""} ${isDesktop ? "department-sheet-desktop" : ""}`.trim()}
        id="department-sheet"
        aria-labelledby="department-sheet-title"
        role="dialog"
        aria-modal="true"
        tabIndex={-1}
        onClick={(event) => event.stopPropagation()}
      >
        {isDesktop ? (
          <MegaMenuSheet
            panel={panel}
            onClose={close}
            openDepartment={(departmentSlug) => openDepartment(departmentSlug, null)}
            scrollRegionRef={scrollRegionRef}
          />
        ) : (
          <>
            <div className="sheet-handle" aria-hidden="true" />
            <div className="sheet-brand-row" aria-hidden="true" />
            {panel.type === "all" ? (
              <AllDepartmentsSheet
                onClose={close}
                openDepartment={(departmentSlug) => openDepartment(departmentSlug, null)}
                scrollRegionRef={scrollRegionRef}
              />
            ) : (
              <DepartmentLeavesSheet departmentSlug={panel.departmentSlug} onClose={close} scrollRegionRef={scrollRegionRef} />
            )}
          </>
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
