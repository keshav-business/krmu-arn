import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext(null);

export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved === 'true';
  });

  useEffect(() => {
    localStorage.setItem('darkMode', isDarkMode);
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    setIsDarkMode(prev => !prev);
  };

  // KRMU Colors
  const colors = {
    light: {
      primary: '#003366',        // Dark Blue
      secondary: '#8B1538',      // Maroon
      accent: '#0078D4',         // Light Blue
      background: '#FFFFFF',
      surface: '#F5F5F5',
      text: '#1A1A1A',
      textSecondary: '#666666',
      border: '#E0E0E0',
      success: '#00A86B',
      warning: '#FFA500',
      error: '#DC143C'
    },
    dark: {
      primary: '#1E5AA8',        // Lighter Blue for dark mode
      secondary: '#B91C4B',      // Lighter Maroon
      accent: '#4A9FDB',         // Lighter Accent Blue
      background: '#0A0A0A',
      surface: '#1A1A1A',
      text: '#FFFFFF',
      textSecondary: '#B0B0B0',
      border: '#333333',
      success: '#00D68F',
      warning: '#FFB946',
      error: '#FF6B6B'
    }
  };

  const theme = isDarkMode ? colors.dark : colors.light;

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleDarkMode, theme, colors }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};
