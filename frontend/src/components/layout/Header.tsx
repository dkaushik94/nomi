import { AppBar, Avatar, Box, IconButton, Toolbar, Tooltip, Typography } from '@mui/material'
import MenuIcon from '@mui/icons-material/Menu'
import LogoutIcon from '@mui/icons-material/Logout'
import { useAuth } from '@/context/AuthContext'

interface HeaderProps {
  onMobileMenuOpen: () => void
}

export default function Header({ onMobileMenuOpen }: HeaderProps) {
  const { user, logout } = useAuth()

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        bgcolor: 'background.paper',
        borderBottom: '1px solid',
        borderColor: 'divider',
        color: 'text.primary',
      }}
    >
      <Toolbar sx={{ minHeight: 56 }}>
        {/* Hamburger — mobile only, opens sidebar overlay */}
        <IconButton
          onClick={onMobileMenuOpen}
          size="small"
          edge="start"
          sx={{ mr: 1, color: 'text.secondary', display: { xs: 'flex', sm: 'none' } }}
        >
          <MenuIcon fontSize="small" />
        </IconButton>

        <Box sx={{ flexGrow: 1 }} />

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Typography variant="body2" color="text.secondary" sx={{ display: { xs: 'none', sm: 'block' } }}>
            {user?.email}
          </Typography>
          <Avatar sx={{ width: 30, height: 30, bgcolor: 'primary.dark', fontSize: 13, color: 'primary.contrastText', fontWeight: 700 }}>
            {user?.email?.[0]?.toUpperCase()}
          </Avatar>
          <Tooltip title="Sign out">
            <IconButton onClick={logout} size="small" sx={{ color: 'text.secondary', '&:hover': { color: 'error.main' } }}>
              <LogoutIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Toolbar>
    </AppBar>
  )
}
