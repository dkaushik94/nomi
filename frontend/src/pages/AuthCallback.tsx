import { Box, CircularProgress, Typography } from '@mui/material'
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/services/supabase'
import { exchangeGoogleToken } from '@/services/api'
import { useAuth } from '@/context/AuthContext'

export default function AuthCallback() {
  const navigate = useNavigate()
  const { refreshUser } = useAuth()

  useEffect(() => {
    let cancelled = false

    const run = async () => {
      // If a token already exists (e.g. StrictMode double-invoke), skip exchange
      if (localStorage.getItem('dobby_token')) {
        await refreshUser()
        if (!cancelled) navigate('/')
        return
      }

      const { data: { session }, error } = await supabase.auth.getSession()
      if (error || !session) {
        if (!cancelled) navigate('/login')
        return
      }

      try {
        const token = await exchangeGoogleToken({
          supabase_uid: session.user.id,
          email: session.user.email ?? '',
          access_token: session.access_token,
        })
        localStorage.setItem('dobby_token', token)
        await refreshUser()
        if (!cancelled) navigate('/')
      } catch {
        if (!cancelled) navigate('/login')
      }
    }

    run()
    return () => { cancelled = true }
  }, [navigate, refreshUser])

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: 2 }}>
      <CircularProgress />
      <Typography color="text.secondary">Completing sign in...</Typography>
    </Box>
  )
}
