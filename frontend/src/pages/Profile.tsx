import {
  Avatar,
  Box,
  Card,
  CardContent,
  Chip,
  Divider,
  Typography,
} from '@mui/material'
import AccountBalanceIcon from '@mui/icons-material/AccountBalance'
import CalendarTodayIcon from '@mui/icons-material/CalendarToday'
import EmailIcon from '@mui/icons-material/Email'
import { useAuth } from '@/context/AuthContext'

function getDisplayName(email: string) {
  const local = email.split('@')[0]
  return local.charAt(0).toUpperCase() + local.slice(1).replace(/[._-]/g, ' ')
}

function InfoRow({ icon, label, value, valueColor }: {
  icon: React.ReactNode
  label: string
  value: string
  valueColor?: string
}) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
      <Box sx={{ color: 'text.secondary', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
        {icon}
      </Box>
      <Box>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ textTransform: 'uppercase', fontSize: 10, letterSpacing: 0.5, display: 'block' }}
        >
          {label}
        </Typography>
        <Typography variant="body2" fontWeight={500} color={valueColor ?? 'text.primary'}>
          {value}
        </Typography>
      </Box>
    </Box>
  )
}

export default function Profile() {
  const { user } = useAuth()
  if (!user) return null

  const displayName = getDisplayName(user.email)
  const memberSince = new Date(user.created_at).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

  return (
    <Box sx={{ maxWidth: 480, mx: 'auto', py: 2 }}>
      <Typography variant="h5" mb={3}>Profile</Typography>

      <Card>
        <CardContent sx={{ p: 3 }}>
          {/* Avatar + name */}
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', pb: 3 }}>
            <Avatar
              sx={{
                width: 72, height: 72,
                bgcolor: 'primary.main',
                color: 'primary.contrastText',
                fontSize: 28, fontWeight: 800, mb: 2,
              }}
            >
              {user.email[0].toUpperCase()}
            </Avatar>
            <Typography variant="h6" fontWeight={700}>{displayName}</Typography>
            {user.is_admin && (
              <Chip label="Admin" size="small" color="primary" sx={{ mt: 1 }} />
            )}
          </Box>

          <Divider sx={{ mb: 3 }} />

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <InfoRow
              icon={<EmailIcon fontSize="small" />}
              label="Email"
              value={user.email}
            />
            <InfoRow
              icon={<CalendarTodayIcon fontSize="small" />}
              label="Member since"
              value={memberSince}
            />
            <InfoRow
              icon={<AccountBalanceIcon fontSize="small" />}
              label="Bank account"
              value={user.plaid_item_id ? 'Linked' : 'Not linked'}
              valueColor={user.plaid_item_id ? 'success.main' : undefined}
            />
          </Box>
        </CardContent>
      </Card>
    </Box>
  )
}
