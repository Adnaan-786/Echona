"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

// Define the shape of the theme context
interface ThemeContextProps {
  isDark: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextProps | undefined>(undefined);

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return ctx;
};

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider = ({ children }: ThemeProviderProps) => {
  // Default to dark pirate theme
  const [isDark, setIsDark] = useState(true);

  const toggleTheme = () => setIsDark((prev) => !prev);

  // Persist preference in localStorage
  useEffect(() => {
    const stored = localStorage.getItem('pirateTheme');
    if (stored) setIsDark(stored === 'dark');
  }, []);

  useEffect(() => {
    localStorage.setItem('pirateTheme', isDark ? 'dark' : 'light');
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('pirate-dark');
      root.classList.remove('pirate-light');
    } else {
      root.classList.add('pirate-light');
      root.classList.remove('pirate-dark');
    }
  }, [isDark]);

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
