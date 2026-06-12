import React, { createContext, useContext, useEffect } from "react";

// The site is dark-mode only. This context remains so existing imports keep
// compiling, but the theme is permanently locked to dark.

interface ThemeContextType {
  isDark: true;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  const value: ThemeContextType = {
    isDark: true,
    toggleTheme: () => {
      // No-op: dark mode only.
    },
  };

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
