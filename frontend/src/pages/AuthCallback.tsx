import { Box, CircularProgress, Typography } from '@mui/material'
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/services/supabase'
import { exchangeGoogleToken } from '@/services/api'
import { useAuth } from '@/context/AuthContext'
import type { Session } from '@supabase/supabase-js'

// Module-level flag: persists across React StrictMode double-mounts so we
// never fire more than one token exchange per page load.
let exchangeInProgress = false

export default function AuthCallback() {
  const navigate = useNavigate()
  const { refreshUser } = useAuth()

  useEffect(() => {
    let done = false

    const handleSession = async (session: Session) => {
      if (done || exchangeInProgress) return
      done = true
      exchangeInProgress = true

      try {
        const token = await exchangeGoogleToken({
          supabase_uid: session.user.id,
          email: session.user.email ?? '',
          access_token: session.access_token,
        })
        localStorage.setItem('dobby_token', token)
        await refreshUser()
        navigate('/')
      } catch {
        exchangeInProgress = false
        navigate('/login')
      }
    }

    // If a token already exists (e.g. StrictMode double-invoke), skip exchange
    if (localStorage.getItem('dobby_token')) {
      refreshUser().then(() => navigate('/'))
      return
    }

    // Subscribe BEFORE calling getSession so we never miss the SIGNED_IN event.
    // With PKCE flow the code exchange is async — getSession() alone can return
    // null if called before the exchange completes.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        subscription.unsubscribe()
        handleSession(session)
      }
    })

    // Also check for an already-processed session (handles implicit flow or a
    // code exchange that finished before the subscription was set up).
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        subscription.unsubscribe()
        handleSession(session)
      }
    })

    // Safety timeout — if neither path resolves, send the user back to login
    const timeout = setTimeout(() => {
      if (!done) {
        done = true
        subscription.unsubscribe()
        navigate('/login')
      }
    }, 15_000)

    return () => {
      done = true
      subscription.unsubscribe()
      clearTimeout(timeout)
    }
  }, [navigate, refreshUser])

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: 2 }}>
      <CircularProgress />
      <Typography color="text.secondary">Completing sign in...</Typography>
    </Box>
  )
}
