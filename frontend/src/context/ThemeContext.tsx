import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material'

export type ThemeMode = 'light' | 'dark'

interface ThemeContextValue {
  mode: ThemeMode
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

function buildTheme(mode: ThemeMode) {
  const dark = mode === 'dark'
  return createTheme({
    palette: {
      mode,
      primary: dark
        ? { main: '#0fc4b5', dark: '#0a9e91', light: '#4dd9cd', contrastText: '#070d14' }
        : { main: '#0a9e91', dark: '#077a70', light: '#0fc4b5', contrastText: '#ffffff' },
      secondary: dark
        ? { main: '#c9a227', dark: '#a07d15', light: '#e0bc5a', contrastText: '#070d14' }
        : { main: '#a07d15', dark: '#7a5f0f', light: '#c9a227', contrastText: '#ffffff' },
      background: dark
        ? { default: '#070d14', paper: '#0d1825' }
        : { default: '#f0f4f8', paper: '#ffffff' },
      error: { main: '#f04438' },
      warning: { main: '#f79009' },
      success: { main: '#17b26a' },
      text: dark
        ? { primary: '#e2edf4', secondary: '#6e9db0' }
        : { primary: '#0d1a27', secondary: '#4a7080' },
      divider: dark ? 'rgba(15,196,181,0.1)' : 'rgba(10,158,145,0.12)',
    },
    typography: {
      fontFamily: '"Inter", "Roboto", sans-serif',
      h5: { fontWeight: 700 },
      h6: { fontWeight: 700 },
      subtitle1: { fontWeight: 600 },
      subtitle2: { fontWeight: 600 },
    },
    shape: { borderRadius: 10 },
    components: {
      MuiButton: { defaultProps: { disableElevation: true } },
      MuiCard: {
        defaultProps: { elevation: 0 },
        styleOverrides: {
          root: {
            border: dark ? '1px solid rgba(15,196,181,0.1)' : '1px solid rgba(10,158,145,0.12)',
            backgroundImage: 'none',
          },
        },
      },
      MuiPaper: {
        defaultProps: { elevation: 0 },
        styleOverrides: { root: { backgroundImage: 'none' } },
      },
      MuiTableCell: {
        styleOverrides: {
          root: { borderColor: dark ? 'rgba(15,196,181,0.08)' : 'rgba(10,158,145,0.1)' },
        },
      },
      MuiChip: {
        styleOverrides: { root: { fontWeight: 500 } },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            backgroundImage: 'none',
            borderRight: dark
              ? '1px solid rgba(15,196,181,0.1)'
              : '1px solid rgba(10,158,145,0.12)',
          },
        },
      },
    },
  })
}

export function AppThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>(
    () => (localStorage.getItem('dobby_theme') as ThemeMode | null) ?? 'dark',
  )

  const toggleTheme = useCallback(() => {
    setMode((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark'
      localStorage.setItem('dobby_theme', next)
      return next
    })
  }, [])

  const theme = useMemo(() => buildTheme(mode), [mode])

  return (
    <ThemeContext.Provider value={{ mode, toggleTheme }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ThemeContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useThemeMode(): ThemeContextValue {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useThemeMode must be used within AppThemeProvider')
  return ctx
}
