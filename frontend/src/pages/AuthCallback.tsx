import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/services/supabase'
import { exchangeGoogleToken } from '@/services/api'
import { useAuth } from '@/context/AuthContext'
import { Spinner } from '@/components/ui/Spinner'

export default function AuthCallback() {
  const navigate = useNavigate()
  const { refreshUser } = useAuth()

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { navigate('/login', { replace: true }); return }
      try {
        const token = await exchangeGoogleToken({
          supabase_uid: session.user.id,
          email: session.user.email!,
          access_token: session.access_token,
        })
        localStorage.setItem('dobby_token', token)
        // Populate AuthContext before navigating so RequireAuth sees user !== null
        await refreshUser()
        navigate('/', { replace: true })
      } catch {
        navigate('/login', { replace: true })
      }
    })
  }, [navigate, refreshUser])

  return (
    <div className="flex items-center justify-center min-h-dvh bg-bg">
      <Spinner />
    </div>
  )
}
