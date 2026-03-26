import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material'
import { AuthProvider } from '@/context/AuthContext'
import App from './App'

// Palette pulled from the Dobby logo: deep navy, teal, gold
const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#0fc4b5', dark: '#0a9e91', light: '#4dd9cd', contrastText: '#070d14' },
    secondary: { main: '#c9a227', dark: '#a07d15', light: '#e0bc5a', contrastText: '#070d14' },
    background: { default: '#070d14', paper: '#0d1825' },
    error: { main: '#f04438' },
    warning: { main: '#f79009' },
    success: { main: '#17b26a' },
    text: { primary: '#e2edf4', secondary: '#6e9db0' },
    divider: 'rgba(15, 196, 181, 0.1)',
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
        root: { border: '1px solid rgba(15,196,181,0.1)', backgroundImage: 'none' },
      },
    },
    MuiPaper: {
      defaultProps: { elevation: 0 },
      styleOverrides: { root: { backgroundImage: 'none' } },
    },
    MuiTableCell: {
      styleOverrides: { root: { borderColor: 'rgba(15,196,181,0.08)' } },
    },
    MuiChip: {
      styleOverrides: { root: { fontWeight: 500 } },
    },
  },
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AuthProvider>
          <App />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
