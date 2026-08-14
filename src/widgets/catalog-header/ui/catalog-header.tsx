import Image from "next/image";
import Link from "next/link";

import { DepartmentMenuButton, DepartmentRail } from "@/features/department-navigation";

export function CatalogHeader({ mobileSearch = "header" }: Readonly<{ mobileSearch?: "header" | "listing" | "hidden" }>): React.JSX.Element {
  return (
    <header className="site-header" data-sheet-background>
      <div className="header-inner">
        <Link className="brand-lockup" href="/" aria-label="Salvat Ofertas, inicio">
          <span className="brand-mark"><Image src="/brand/salvat-brand-seal.jpeg" alt="" width={40} height={40} priority /></span>
          <span>
            <span className="brand-name">salvat&amp;brand</span>
            <span className="brand-subtitle">ofertas escolhidas</span>
          </span>
        </Link>
        <DepartmentMenuButton />
        <form className={`search-form header-search-form ${mobileSearch !== "header" ? "mobile-search-hidden" : ""}`.trim()} action="/buscar" method="get" role="search">
          <label className="sr-only" htmlFor="catalog-search">Buscar produtos</label>
          <input
            id="catalog-search"
            name="q"
            type="search"
            placeholder="O que voce esta procurando?"
            autoComplete="off"
          />
          <button type="submit" aria-label="Buscar produtos" className="search-submit">
            Buscar
          </button>
        </form>
      </div>
      <DepartmentRail />
    </header>
  );
}
