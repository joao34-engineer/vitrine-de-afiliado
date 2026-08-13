import Link from "next/link";

import { DepartmentRail } from "@/features/department-navigation";

export function CatalogHeader(): React.JSX.Element {
  return (
    <header className="site-header">
      <div className="header-inner">
        <Link className="brand-lockup" href="/" aria-label="Salvat Ofertas, inicio">
          <span className="brand-mark" aria-hidden="true">S</span>
          <span>
            <span className="brand-name">salvat&amp;brand</span>
            <span className="brand-subtitle">ofertas escolhidas</span>
          </span>
        </Link>
        <form className="search-form" action="/buscar" method="get" role="search">
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
