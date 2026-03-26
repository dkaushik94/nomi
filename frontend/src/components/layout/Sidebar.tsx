import {
  Box,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import DashboardIcon from '@mui/icons-material/Dashboard'
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong'
import LabelIcon from '@mui/icons-material/Label'
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import { NavLink } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'

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

function NavItems({
  collapsed,
  isAdmin,
  onClose,
}: {
  collapsed: boolean
  isAdmin: boolean
  onClose?: () => void
}) {
  const items = [
    ...NAV_ITEMS,
    ...(isAdmin ? [{ label: 'Admin', icon: <AdminPanelSettingsIcon fontSize="small" />, to: '/admin' }] : []),
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
            sx={{
              borderRadius: 2,
              mb: 0.5,
              justifyContent: collapsed ? 'center' : 'flex-start',
              minHeight: 40,
              color: 'text.secondary',
              '&.active': {
                bgcolor: 'rgba(15,196,181,0.12)',
                color: 'primary.main',
                '& .MuiListItemIcon-root': { color: 'primary.main' },
              },
              '&:hover': { bgcolor: 'rgba(15,196,181,0.06)', color: 'text.primary' },
            }}
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
  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Logo + toggle */}
      <Box
        sx={{
          px: collapsed ? 1 : 2.5,
          py: 2.5,
          display: 'flex',
          alignItems: 'center',
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
                '&:hover': { bgcolor: 'rgba(255,255,255,0.06)', color: 'text.primary' },
              }}
            >
              <ChevronLeftIcon fontSize="small" />
            </Box>
          </Tooltip>
        )}
      </Box>

      {/* Expand button when collapsed */}
      {collapsed && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1 }}>
          <Tooltip title="Expand sidebar" placement="right">
            <Box
              onClick={onToggle}
              sx={{
                width: 28, height: 28, borderRadius: 1,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', color: 'text.secondary',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.06)', color: 'text.primary' },
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

  // Mobile: overlay drawer — open when NOT collapsed, close by collapsing
  if (isMobile) {
    return (
      <Drawer
        variant="temporary"
        open={!collapsed}
        onClose={onToggle}
        ModalProps={{ keepMounted: true }}
        sx={{
          '& .MuiDrawer-paper': { ...paperSx, width: 240, transition: 'none' },
        }}
      >
        <SidebarContent
          collapsed={false}
          onToggle={onToggle}
          isAdmin={!!user?.is_admin}
          onClose={onToggle}
        />
      </Drawer>
    )
  }

  // Desktop: permanent drawer with collapse
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
      <SidebarContent
        collapsed={collapsed}
        onToggle={onToggle}
        isAdmin={!!user?.is_admin}
      />
    </Drawer>
  )
}
