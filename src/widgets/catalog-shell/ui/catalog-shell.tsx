import type { ReactNode } from "react";

import { CatalogFooter } from "@/widgets/catalog-footer";
import { CatalogHeader } from "@/widgets/catalog-header";

export function CatalogShell({ children }: Readonly<{ children: ReactNode }>): React.JSX.Element {
  return (
    <div className="catalog-app">
      <CatalogHeader />
      <main className="catalog-main">{children}</main>
      <CatalogFooter />
    </div>
  );
}
