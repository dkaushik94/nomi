import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { usePlaidModalConstraint } from '@/hooks/usePlaidModalConstraint'
import Layout from '@/components/layout/Layout'
import Login from '@/pages/Login'
import Dashboard from '@/pages/Dashboard'
import Transactions from '@/pages/Transactions'
import Tags from '@/pages/Tags'
import Insights from '@/pages/Insights'
import Profile from '@/pages/Profile'
import Admin from '@/pages/Admin'
import AuthCallback from '@/pages/AuthCallback'
import { Spinner } from '@/components/ui/Spinner'

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return (
    <div className="flex items-center justify-center min-h-dvh bg-bg">
      <Spinner />
    </div>
  )
  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}

function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  if (!user?.is_admin) return <Navigate to="/" replace />
  return <>{children}</>
}

export default function App() {
  usePlaidModalConstraint()

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route
        path="/"
        element={
          <RequireAuth>
            <Layout />
          </RequireAuth>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="transactions" element={<Transactions />} />
        <Route path="tags" element={<Tags />} />
        <Route path="insights" element={<Insights />} />
        <Route path="profile" element={<Profile />} />
        <Route path="admin" element={<RequireAdmin><Admin /></RequireAdmin>} />
      </Route>
    </Routes>
  )
}
