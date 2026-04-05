import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  compactMode: boolean;
  toggleCompactMode: () => void;
  setCompactMode: (compact: boolean) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    // Always default to light mode
    // Check localStorage, but default to 'light' if not set or invalid
    const stored = localStorage.getItem('theme') as Theme;
    return (stored === 'dark' || stored === 'light') ? stored : 'light';
  });

  const [compactMode, setCompactModeState] = useState<boolean>(() => {
    // Default to compact mode ON
    const stored = localStorage.getItem('compactMode');
    return stored === null ? true : stored === 'true';
  });

  useEffect(() => {
    const root = document.documentElement;
    
    // Add transition class for smooth theme switching
    root.style.transition = 'background-color 0.3s ease, color 0.3s ease';
    
    // Apply theme to document
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    
    // Save to localStorage
    localStorage.setItem('theme', theme);
    
    // Remove transition after theme change completes
    const timeout = setTimeout(() => {
      root.style.transition = '';
    }, 300);
    
    return () => clearTimeout(timeout);
  }, [theme]);

  useEffect(() => {
    // Save compact mode to localStorage
    localStorage.setItem('compactMode', compactMode.toString());
  }, [compactMode]);

  const toggleTheme = () => {
    setThemeState(prev => prev === 'light' ? 'dark' : 'light');
  };

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  const toggleCompactMode = () => {
    setCompactModeState(prev => !prev);
  };

  const setCompactMode = (compact: boolean) => {
    setCompactModeState(compact);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme, compactMode, toggleCompactMode, setCompactMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
