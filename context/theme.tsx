import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useColorScheme, Platform } from 'react-native';
import { LightColors, DarkColors } from '@/lib/theme';

type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextType {
  mode: ThemeMode;
  isDark: boolean;
  colors: typeof LightColors;
  setMode: (mode: ThemeMode) => void;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

const THEME_KEY = 'medtrack_theme_mode';

function getStoredMode(): ThemeMode | null {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    const stored = localStorage.getItem(THEME_KEY);
    if (stored === 'light' || stored === 'dark' || stored === 'system') {
      return stored;
    }
  }
  return null;
}

function setStoredMode(mode: ThemeMode) {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    localStorage.setItem(THEME_KEY, mode);
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemColorScheme = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>('system');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const stored = getStoredMode();
    if (stored) setModeState(stored);
    setLoaded(true);
  }, []);

  const setMode = (newMode: ThemeMode) => {
    setModeState(newMode);
    setStoredMode(newMode);
  };

  const toggle = () => {
    const newMode = isDark ? 'light' : 'dark';
    setMode(newMode);
  };

  const isDark = mode === 'dark' || (mode === 'system' && systemColorScheme === 'dark');
  const colors = isDark ? DarkColors : LightColors;

  if (!loaded) return null;

  return (
    <ThemeContext.Provider value={{ mode, isDark, colors, setMode, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
