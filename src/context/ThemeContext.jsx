import { createContext, useContext, useEffect, useState } from 'react';

// Portado desde js/theme.js. Misma lógica: localStorage 'erp_theme',
// respeta prefers-color-scheme si no hay nada guardado, y refleja el
// tema en el atributo data-theme de <html> (de ahí lo leen themes.css /
// components.css / base.css sin ningún cambio).
const ThemeContext = createContext(null);

function getInitialTheme() {
  const saved = localStorage.getItem('erp_theme');
  if (saved === 'light' || saved === 'dark') return saved;
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
    return 'light';
  }
  return 'dark';
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  function toggleTheme() {
    setTheme((current) => {
      const next = current === 'light' ? 'dark' : 'light';
      localStorage.setItem('erp_theme', next);
      return next;
    });
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme debe usarse dentro de <ThemeProvider>');
  return ctx;
}
