import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { supabase, signOut } from '@/services/supabase'
import { getProfile } from '@/services/api'
import type { User } from '@/types'

interface AuthContextValue {
  user: User | null
  loading: boolean
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  // Only loads the profile if a dobby_token already exists — never exchanges tokens.
  // Token exchange is handled exclusively by AuthCallback.tsx.
  const bootstrap = useCallback(async () => {
    const token = localStorage.getItem('dobby_token')
    if (!token) {
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const profile = await getProfile()
      setUser(profile)
    } catch {
      localStorage.removeItem('dobby_token')
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    bootstrap()
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      // Only react to explicit sign-out — do not re-bootstrap on SIGNED_IN
      // to avoid racing with AuthCallback's token exchange.
      if (event === 'SIGNED_OUT') {
        localStorage.removeItem('dobby_token')
        setUser(null)
      }
    })
    return () => subscription.unsubscribe()
  }, [bootstrap])

  const logout = useCallback(async () => {
    await signOut()
    localStorage.removeItem('dobby_token')
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, logout, refreshUser: bootstrap }}>
      {children}
    </AuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
