import React, { createContext, useState, useContext, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { MD3LightTheme, MD3DarkTheme } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Define custom premium vintage palettes
export const VintageLightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#704235',          // Warm Mahogany
    primaryContainer: '#F7D6CD',
    secondary: '#5E7A60',        // Muted Sage Green
    secondaryContainer: '#E2EFE3',
    background: '#FAF6F0',       // Warm Parchment
    surface: '#FFFDF9',          // Cream Paper
    surfaceVariant: '#F3ECE4',   // Muted card accent
    onSurfaceVariant: '#5c544d',
    text: '#2E2A27',
    onSurface: '#2E2A27',
    onBackground: '#2E2A27',
    error: '#BA1A1A',
    outline: '#E3DCD5',          // Soft sand border
    accent: '#C5A059',           // Antique gold
    gold: '#C5A059',
    success: '#4A8A55',          // Soft profit green
    soldOverlay: 'rgba(112, 66, 53, 0.1)',
  },
  roundness: 12,
};

export const VintageDarkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#D29F90',          // Pale Terracotta
    primaryContainer: '#542E24',
    secondary: '#A2B5A3',        // Pale Sage
    secondaryContainer: '#354E37',
    background: '#1A1816',       // Deep Charcoal
    surface: '#262320',          // Muted bronze-black
    surfaceVariant: '#332F2B',
    onSurfaceVariant: '#A89E94',
    text: '#F4EFEA',
    onSurface: '#F4EFEA',
    onBackground: '#F4EFEA',
    error: '#FFB4AB',
    outline: '#3E3A36',          // Dark Clay border
    accent: '#DFBA73',           // Muted Gold
    gold: '#DFBA73',
    success: '#6EBA7B',
    soldOverlay: 'rgba(210, 159, 144, 0.15)',
  },
  roundness: 12,
};

const ThemeContext = createContext({
  isDarkMode: false,
  toggleTheme: () => {},
  theme: VintageLightTheme,
  tempPhotos: [],
  setTempPhotos: () => {},
});

export const useAppTheme = () => useContext(ThemeContext);

export const AppThemeProvider = ({ children }) => {
  const systemScheme = useColorScheme();
  const [isDarkMode, setIsDarkMode] = useState(systemScheme === 'dark');
  const [tempPhotos, setTempPhotos] = useState([]);

  useEffect(() => {
    // Load theme preference from async storage
    AsyncStorage.getItem('themePreference').then(savedTheme => {
      if (savedTheme !== null) {
        setIsDarkMode(savedTheme === 'dark');
      } else {
        setIsDarkMode(systemScheme === 'dark');
      }
    });
  }, [systemScheme]);

  const toggleTheme = () => {
    setIsDarkMode(prev => {
      const next = !prev;
      AsyncStorage.setItem('themePreference', next ? 'dark' : 'light');
      return next;
    });
  };

  const theme = isDarkMode ? VintageDarkTheme : VintageLightTheme;

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme, theme, tempPhotos, setTempPhotos }}>
      {children}
    </ThemeContext.Provider>
  );
};
