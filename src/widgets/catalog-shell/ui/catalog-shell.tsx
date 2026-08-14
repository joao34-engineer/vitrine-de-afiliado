import type { ReactNode } from "react";

import { CatalogFooter } from "@/widgets/catalog-footer";
import { CatalogHeader } from "@/widgets/catalog-header";
import {
  DepartmentNavigationProvider,
  DepartmentSheet,
} from "@/features/department-navigation";

export function CatalogShell({ children, mobileSearch = "header", mobileRail = "header" }: Readonly<{
  children: ReactNode;
  mobileSearch?: "header" | "listing" | "hidden";
  mobileRail?: "header" | "listing" | "hidden";
}>): React.JSX.Element {
  return (
    <DepartmentNavigationProvider>
      <div className="catalog-app">
        <CatalogHeader mobileSearch={mobileSearch} mobileRail={mobileRail} />
        <main className="catalog-main" data-sheet-background>{children}</main>
        <CatalogFooter />
        <DepartmentSheet />
      </div>
    </DepartmentNavigationProvider>
  );
}
