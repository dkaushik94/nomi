import { AppBar, IconButton, Toolbar } from '@mui/material'
import MenuIcon from '@mui/icons-material/Menu'

interface HeaderProps {
  onMobileMenuOpen: () => void
}

// Mobile-only bar — desktop user controls live in the sidebar bottom section.
export default function Header({ onMobileMenuOpen }: HeaderProps) {
  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        bgcolor: 'background.paper',
        borderBottom: '1px solid',
        borderColor: 'divider',
        color: 'text.primary',
        display: { xs: 'flex', sm: 'none' },
      }}
    >
      <Toolbar sx={{ minHeight: 48 }}>
        <IconButton
          onClick={onMobileMenuOpen}
          size="small"
          edge="start"
          sx={{ color: 'text.secondary' }}
        >
          <MenuIcon fontSize="small" />
        </IconButton>
      </Toolbar>
    </AppBar>
  )
}
