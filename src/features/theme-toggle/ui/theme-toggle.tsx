"use client";

import Image from "next/image";

import { useTheme } from "../model/theme-context";

export function ThemeToggle(): React.JSX.Element {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={toggleTheme}
      aria-label={isDark ? "Ativar modo claro" : "Ativar modo escuro"}
      aria-pressed={isDark}
    >
      <Image
        src={isDark ? "/icons/theme-sun.svg" : "/icons/theme-moon.svg"}
        alt=""
        width={40}
        height={40}
        unoptimized
        aria-hidden
      />
    </button>
  );
}
