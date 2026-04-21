import { useLocation } from 'react-router-dom'
import { Sun, Moon } from 'lucide-react'
import { NomiLogo } from '@/components/ui/NomiLogo'
import { useThemeMode } from '@/context/ThemeContext'
import { useTopBarActions } from '@/context/TopBarActionsContext'

const TITLES: Record<string, string> = {
  '/': 'Overview',
  '/transactions': 'Activity',
  '/tags': 'Tags',
  '/insights': 'Insights',
  '/profile': 'Profile',
}

export function TopBar() {
  const { pathname } = useLocation()
  const { mode, toggleTheme } = useThemeMode()
  const { actions } = useTopBarActions()
  const title = TITLES[pathname] ?? 'nomi'

  return (
    <header className="flex items-center justify-between px-4 md:px-8 h-[52px] border-b border-brd flex-shrink-0 bg-bg">
      {/* Mobile: logo; desktop: page title */}
      <div className="flex items-center gap-2 md:hidden">
        <NomiLogo size={24} />
        <span className="font-display font-extrabold text-lg tracking-tight text-ink">nomi</span>
      </div>
      <span className="hidden md:block font-display font-bold text-[17px] text-ink">{title}</span>

      <div className="flex items-center gap-2">
        {actions}
        <button
          onClick={toggleTheme}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-muted hover:text-ink hover:bg-card transition-colors"
          aria-label="Toggle theme"
        >
          {mode === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>
      </div>
    </header>
  )
}
