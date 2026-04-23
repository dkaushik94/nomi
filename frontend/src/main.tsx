import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from '@/context/AuthContext'
import { AppThemeProvider } from '@/context/ThemeContext'
import { TopBarActionsProvider } from '@/context/TopBarActionsContext'
import App from './App'
import './styles/globals.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AppThemeProvider>
        <AuthProvider>
          <TopBarActionsProvider>
            <App />
          </TopBarActionsProvider>
        </AuthProvider>
      </AppThemeProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
