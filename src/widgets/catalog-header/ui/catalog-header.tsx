import Image from "next/image";
import Link from "next/link";

import { DepartmentMenuButton, DepartmentRail } from "@/features/department-navigation";
import { ThemeToggle } from "@/features/theme-toggle";

export function CatalogHeader({ mobileSearch = "header", mobileRail = "header" }: Readonly<{
  mobileSearch?: "header" | "listing" | "hidden";
  mobileRail?: "header" | "listing" | "hidden";
}>): React.JSX.Element {
  return (
    <header className="site-header" data-sheet-background>
      <div className="header-inner">
        <Link className="brand-lockup" href="/" aria-label="Salvat Ofertas, inicio">
          <span className="brand-mark"><Image src="/brand/salvat-brand-seal.png" alt="" width={38} height={38} priority /></span>
          <span>
            <span className="brand-name">salvat&amp;brand</span>
            <span className="brand-subtitle">achados selecionados</span>
          </span>
        </Link>
        <form className={`search-form header-search-form ${mobileSearch !== "header" ? "mobile-search-hidden" : ""}`.trim()} action="/buscar" method="get" role="search">
          <label className="sr-only" htmlFor="catalog-search">Buscar produtos</label>
          <input
            id="catalog-search"
            name="q"
            type="search"
            placeholder="Buscar achadinhos"
            autoComplete="off"
          />
          <button type="submit" aria-label="Buscar produtos" className="search-submit">
            Buscar
          </button>
        </form>
        <div className="header-actions">
          <ThemeToggle />
          <DepartmentMenuButton />
        </div>
      </div>
      <DepartmentRail className={`header-department-rail mobile-rail-${mobileRail}`.trim()} />
    </header>
  );
}
