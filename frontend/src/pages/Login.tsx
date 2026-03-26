import { Box, Button, CircularProgress, Divider, Paper, Typography } from '@mui/material'
import GoogleIcon from '@mui/icons-material/Google'
import LockOutlinedIcon from '@mui/icons-material/LockOutlined'
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined'
import StorageOutlinedIcon from '@mui/icons-material/StorageOutlined'
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined'
import { useState } from 'react'
import { signInWithGoogle } from '@/services/supabase'

function PrivacyPoint({ icon, heading, body }: { icon: React.ReactNode; heading: string; body: string }) {
  return (
    <Box sx={{ display: 'flex', gap: 1.5, textAlign: 'left' }}>
      <Box sx={{ color: 'primary.main', flexShrink: 0, mt: 0.15 }}>{icon}</Box>
      <Box>
        <Typography variant="caption" fontWeight={700} color="text.primary" display="block" sx={{ lineHeight: 1.4 }}>
          {heading}
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.5 }}>
          {body}
        </Typography>
      </Box>
    </Box>
  )
}

export default function Login() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleLogin = async () => {
    setLoading(true)
    setError(null)
    try {
      await signInWithGoogle()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
      setLoading(false)
    }
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
        p: 2,
        background: 'radial-gradient(ellipse at 50% 0%, rgba(15,196,181,0.08) 0%, #070d14 60%)',
      }}
    >
      <Paper
        elevation={0}
        sx={{
          p: { xs: 3, sm: 5 },
          maxWidth: 420,
          width: '100%',
          textAlign: 'center',
          bgcolor: 'background.paper',
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 3,
        }}
      >
        {/* Logo */}
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2.5 }}>
          <Box
            component="img"
            src="/logo.png"
            alt="Dobby"
            sx={{ width: 64, height: 64, borderRadius: '16px', objectFit: 'cover' }}
          />
        </Box>

        <Typography variant="h5" fontWeight={800} color="primary.main" mb={0.5}>
          DOBBY
        </Typography>
        <Typography variant="body2" color="text.secondary" mb={3}>
          Take control of your finances with Dobby. Sign in to get started!
        </Typography>

        {error && (
          <Typography color="error.main" variant="body2" mb={2}>
            {error}
          </Typography>
        )}

        <Button
          variant="contained"
          size="large"
          startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <GoogleIcon />}
          onClick={handleLogin}
          disabled={loading}
          fullWidth
          sx={{
            borderRadius: 2,
            textTransform: 'none',
            fontWeight: 600,
            py: 1.25,
            bgcolor: 'primary.main',
            color: 'primary.contrastText',
            '&:hover': { bgcolor: 'primary.dark' },
          }}
        >
          Continue with Google
        </Button>

        {/* Privacy disclaimer */}
        <Box
          sx={{
            mt: 3,
            p: 2,
            borderRadius: 2,
            bgcolor: 'rgba(15,196,181,0.04)',
            border: '1px solid rgba(15,196,181,0.12)',
            textAlign: 'left',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 1.5 }}>
            <LockOutlinedIcon sx={{ fontSize: 13, color: 'primary.main' }} />
            <Typography variant="caption" fontWeight={700} color="primary.main" sx={{ textTransform: 'uppercase', letterSpacing: 0.8, fontSize: 10 }}>
              Your privacy, our commitment
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            <PrivacyPoint
              icon={<ShieldOutlinedIcon sx={{ fontSize: 16 }} />}
              heading="End-to-end encryption"
              body="All financial data — including your bank transactions and account details — is encrypted at rest and in transit using industry-standard AES-256 and TLS 1.3. Nobody, including us, can read your raw data in plaintext."
            />

            <PrivacyPoint
              icon={<StorageOutlinedIcon sx={{ fontSize: 16 }} />}
              heading="Row-level security & strict data isolation"
              body="Your data is protected by row-level security (RLS) enforced at the database layer. Every query is scoped to your unique user ID — it is architecturally impossible for another user's session to access your records, even in the event of an application-layer bug."
            />

            <PrivacyPoint
              icon={<VisibilityOffOutlinedIcon sx={{ fontSize: 16 }} />}
              heading="Never sold, never shared, never used for ads"
              body="Your financial data is never disclosed, rented, or sold to any third party. It is not used to build advertising profiles, infer purchasing intent, or target you with marketing of any kind — now or in the future."
            />
          </Box>

          <Divider sx={{ my: 1.75, borderColor: 'rgba(15,196,181,0.1)' }} />

          <Typography variant="caption" color="text.secondary" sx={{ fontSize: 10.5, lineHeight: 1.6 }}>
            By signing in you acknowledge that Dobby connects to your bank read-only via{' '}
            <Typography component="span" variant="caption" sx={{ fontSize: 10.5, fontWeight: 600, color: 'text.primary' }}>Plaid</Typography>
            {' '}— a regulated financial data provider. Dobby requests the minimum permissions required (transaction history and balances) and does not initiate or approve any payments on your behalf.
            You may request complete deletion of your data at any time from your account settings.
          </Typography>
        </Box>
      </Paper>
    </Box>
  )
}
