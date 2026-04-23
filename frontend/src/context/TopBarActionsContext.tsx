import { createContext, useContext, useState, type ReactNode } from 'react'

interface TopBarActionsContextValue {
  actions: ReactNode | null
  setActions: (actions: ReactNode | null) => void
}

const TopBarActionsContext = createContext<TopBarActionsContextValue | null>(null)

export function TopBarActionsProvider({ children }: { children: ReactNode }) {
  const [actions, setActions] = useState<ReactNode | null>(null)
  return (
    <TopBarActionsContext.Provider value={{ actions, setActions }}>
      {children}
    </TopBarActionsContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTopBarActions(): TopBarActionsContextValue {
  const ctx = useContext(TopBarActionsContext)
  if (!ctx) throw new Error('useTopBarActions must be used within TopBarActionsProvider')
  return ctx
}
