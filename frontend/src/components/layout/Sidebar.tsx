import {
  Avatar,
  Box,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Switch,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import DashboardIcon from '@mui/icons-material/Dashboard'
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong'
import LabelIcon from '@mui/icons-material/Label'
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings'
import PersonIcon from '@mui/icons-material/Person'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import DarkModeIcon from '@mui/icons-material/DarkMode'
import LightModeIcon from '@mui/icons-material/LightMode'
import LogoutIcon from '@mui/icons-material/Logout'
import { NavLink } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { useThemeMode } from '@/context/ThemeContext'

const NAV_ITEMS = [
  { label: 'Dashboard', icon: <DashboardIcon fontSize="small" />, to: '/' },
  { label: 'Transactions', icon: <ReceiptLongIcon fontSize="small" />, to: '/transactions' },
  { label: 'Categories', icon: <LabelIcon fontSize="small" />, to: '/categories' },
]

interface SidebarProps {
  width: number
  collapsed: boolean
  onToggle: () => void
}

const navSx = {
  borderRadius: 2,
  mb: 0.5,
  minHeight: 40,
  color: 'text.secondary',
  '&.active': {
    bgcolor: 'rgba(15,196,181,0.12)',
    color: 'primary.main',
    '& .MuiListItemIcon-root': { color: 'primary.main' },
  },
  '&:hover': { bgcolor: 'rgba(15,196,181,0.06)', color: 'text.primary' },
}

function NavItems({ collapsed, isAdmin, onClose }: { collapsed: boolean; isAdmin: boolean; onClose?: () => void }) {
  const items = [
    ...NAV_ITEMS,
    ...(isAdmin ? [{ label: 'Admin', icon: <AdminPanelSettingsIcon fontSize="small" />, to: '/admin' }] : []),
    { label: 'Profile', icon: <PersonIcon fontSize="small" />, to: '/profile' },
  ]

  return (
    <List disablePadding>
      {items.map(({ label, icon, to }) => (
        <Tooltip key={to} title={collapsed ? label : ''} placement="right">
          <ListItemButton
            component={NavLink}
            to={to}
            end={to === '/'}
            onClick={onClose}
            sx={{ ...navSx, justifyContent: collapsed ? 'center' : 'flex-start' }}
          >
            <ListItemIcon sx={{ minWidth: collapsed ? 0 : 34, color: 'inherit', justifyContent: 'center' }}>
              {icon}
            </ListItemIcon>
            {!collapsed && (
              <ListItemText primary={label} primaryTypographyProps={{ fontSize: 13.5, fontWeight: 500 }} />
            )}
          </ListItemButton>
        </Tooltip>
      ))}
    </List>
  )
}

function SidebarContent({
  collapsed,
  onToggle,
  isAdmin,
  onClose,
}: {
  collapsed: boolean
  onToggle: () => void
  isAdmin: boolean
  onClose?: () => void
}) {
  const { user, logout } = useAuth()
  const { mode, toggleTheme } = useThemeMode()
  const isDark = mode === 'dark'

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Logo + collapse toggle */}
      <Box
        sx={{
          px: collapsed ? 1 : 2.5, py: 2.5,
          display: 'flex', alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
          gap: 1,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
          <Box
            component="img"
            src="/logo.png"
            alt="Dobby"
            sx={{ width: 32, height: 32, borderRadius: '8px', objectFit: 'cover', flexShrink: 0 }}
          />
          {!collapsed && (
            <Typography variant="h6" fontWeight={800} sx={{ color: 'primary.main', letterSpacing: -0.5 }} noWrap>
              Dobby
            </Typography>
          )}
        </Box>
        {!collapsed && (
          <Tooltip title="Collapse sidebar">
            <Box
              onClick={onToggle}
              sx={{
                width: 24, height: 24, borderRadius: 1,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', color: 'text.secondary',
                '&:hover': { bgcolor: 'action.hover', color: 'text.primary' },
              }}
            >
              <ChevronLeftIcon fontSize="small" />
            </Box>
          </Tooltip>
        )}
      </Box>

      {collapsed && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1 }}>
          <Tooltip title="Expand sidebar" placement="right">
            <Box
              onClick={onToggle}
              sx={{
                width: 28, height: 28, borderRadius: 1,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', color: 'text.secondary',
                '&:hover': { bgcolor: 'action.hover', color: 'text.primary' },
              }}
            >
              <ChevronRightIcon fontSize="small" />
            </Box>
          </Tooltip>
        </Box>
      )}

      {/* Nav */}
      <Box sx={{ px: 1, mt: collapsed ? 0 : 1, flex: 1, overflowY: 'auto' }}>
        {!collapsed && (
          <Typography variant="caption" sx={{ px: 1, mb: 1, display: 'block', color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 1, fontSize: 10 }}>
            Menu
          </Typography>
        )}
        <NavItems collapsed={collapsed} isAdmin={isAdmin} onClose={onClose} />
      </Box>

      {/* Bottom: theme toggle + user + logout */}
      <Box sx={{ px: 1, pb: 1.5 }}>
        <Divider sx={{ mb: 1.5 }} />

        {/* Theme toggle */}
        {collapsed ? (
          <Tooltip title={isDark ? 'Switch to light mode' : 'Switch to dark mode'} placement="right">
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 0.5 }}>
              <IconButton size="small" onClick={toggleTheme} sx={{ color: 'text.secondary', '&:hover': { color: isDark ? 'secondary.main' : 'primary.main' } }}>
                {isDark ? <LightModeIcon fontSize="small" /> : <DarkModeIcon fontSize="small" />}
              </IconButton>
            </Box>
          </Tooltip>
        ) : (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 1, py: 0.5, borderRadius: 2, '&:hover': { bgcolor: 'action.hover' } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {isDark
                ? <DarkModeIcon fontSize="small" sx={{ color: 'text.secondary', fontSize: 16 }} />
                : <LightModeIcon fontSize="small" sx={{ color: 'secondary.main', fontSize: 16 }} />}
              <Typography variant="caption" color="text.secondary" fontWeight={500}>
                {isDark ? 'Dark mode' : 'Light mode'}
              </Typography>
            </Box>
            <Switch
              checked={isDark}
              onChange={toggleTheme}
              size="small"
              sx={{
                '& .MuiSwitch-switchBase.Mui-checked': { color: 'primary.main' },
                '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: 'primary.main' },
              }}
            />
          </Box>
        )}

        {/* User row — links to profile */}
        <Tooltip title={collapsed ? (user?.email ?? '') : ''} placement="right">
          <ListItemButton
            component={NavLink}
            to="/profile"
            end
            onClick={onClose}
            sx={{
              ...navSx,
              justifyContent: collapsed ? 'center' : 'flex-start',
              mb: 0.5, mt: 0.5,
            }}
          >
            <ListItemIcon sx={{ minWidth: collapsed ? 0 : 34, color: 'inherit', justifyContent: 'center' }}>
              <Avatar sx={{ width: 22, height: 22, bgcolor: 'primary.main', color: 'primary.contrastText', fontSize: 11, fontWeight: 700 }}>
                {user?.email?.[0]?.toUpperCase()}
              </Avatar>
            </ListItemIcon>
            {!collapsed && (
              <ListItemText
                primary={user?.email}
                primaryTypographyProps={{ fontSize: 12.5, fontWeight: 500, noWrap: true }}
              />
            )}
          </ListItemButton>
        </Tooltip>

        {/* Logout */}
        {collapsed ? (
          <Tooltip title="Sign out" placement="right">
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <IconButton size="small" onClick={logout} sx={{ color: 'text.secondary', '&:hover': { color: 'error.main' } }}>
                <LogoutIcon fontSize="small" />
              </IconButton>
            </Box>
          </Tooltip>
        ) : (
          <ListItemButton
            onClick={logout}
            sx={{ borderRadius: 2, minHeight: 38, color: 'text.secondary', '&:hover': { bgcolor: 'rgba(240,68,56,0.08)', color: 'error.main' } }}
          >
            <ListItemIcon sx={{ minWidth: 34, color: 'inherit' }}>
              <LogoutIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="Sign out" primaryTypographyProps={{ fontSize: 13.5, fontWeight: 500 }} />
          </ListItemButton>
        )}
      </Box>
    </Box>
  )
}

export default function Sidebar({ width, collapsed, onToggle }: SidebarProps) {
  const { user } = useAuth()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

  const paperSx = {
    width,
    boxSizing: 'border-box' as const,
    bgcolor: 'background.paper',
    borderRight: '1px solid',
    borderColor: 'divider',
    overflow: 'hidden',
    transition: 'width 0.2s ease',
  }

  if (isMobile) {
    return (
      <Drawer
        variant="temporary"
        open={!collapsed}
        onClose={onToggle}
        ModalProps={{ keepMounted: true }}
        sx={{ '& .MuiDrawer-paper': { ...paperSx, width: 240, transition: 'none' } }}
      >
        <SidebarContent collapsed={false} onToggle={onToggle} isAdmin={!!user?.is_admin} onClose={onToggle} />
      </Drawer>
    )
  }

  return (
    <Drawer
      variant="permanent"
      sx={{
        width,
        flexShrink: 0,
        transition: 'width 0.2s ease',
        '& .MuiDrawer-paper': paperSx,
      }}
    >
      <SidebarContent collapsed={collapsed} onToggle={onToggle} isAdmin={!!user?.is_admin} />
    </Drawer>
  )
}
