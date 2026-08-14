"use client";

import { createContext, useContext, useRef, useState, type ReactNode, type RefObject } from "react";

import type { DepartmentSlug } from "@/shared/config/affiliate-taxonomy";

export type DepartmentNavigationPanel =
  | { readonly type: "all" }
  | { readonly type: "department"; readonly departmentSlug: DepartmentSlug }
  | null;

type DepartmentNavigationContextValue = {
  readonly panel: DepartmentNavigationPanel;
  readonly triggerRef: RefObject<HTMLButtonElement | null>;
  readonly openAll: (trigger: HTMLButtonElement) => void;
  readonly openDepartment: (departmentSlug: DepartmentSlug, trigger?: HTMLButtonElement | null) => void;
  readonly close: () => void;
};

const DepartmentNavigationContext = createContext<DepartmentNavigationContextValue | null>(null);

export function DepartmentNavigationProvider({ children }: Readonly<{ children: ReactNode }>): React.JSX.Element {
  const [panel, setPanel] = useState<DepartmentNavigationPanel>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  const value: DepartmentNavigationContextValue = {
    panel,
    triggerRef,
    openAll: (trigger) => {
      triggerRef.current = trigger;
      setPanel({ type: "all" });
    },
    openDepartment: (departmentSlug, trigger) => {
      if (trigger) triggerRef.current = trigger;
      setPanel({ type: "department", departmentSlug });
    },
    close: () => setPanel(null),
  };

  return <DepartmentNavigationContext.Provider value={value}>{children}</DepartmentNavigationContext.Provider>;
}

export function useDepartmentNavigation(): DepartmentNavigationContextValue {
  const context = useContext(DepartmentNavigationContext);
  if (context === null) {
    throw new Error("useDepartmentNavigation must be used inside DepartmentNavigationProvider.");
  }
  return context;
}
