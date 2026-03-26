import { Box } from '@mui/material'
import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Header from './Header'
import Sidebar from './Sidebar'

const SIDEBAR_FULL = 240
const SIDEBAR_MINI = 60

export default function Layout() {
  // On desktop: false = expanded, true = collapsed icon-rail
  // On mobile: false = drawer closed (collapsed), true = drawer open (not collapsed)
  const [collapsed, setCollapsed] = useState(false)
  const sidebarWidth = collapsed ? SIDEBAR_MINI : SIDEBAR_FULL

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <Sidebar width={sidebarWidth} collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} />
      <Box component="main" sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Pass toggle so Header can show hamburger on mobile */}
        <Header onMobileMenuOpen={() => setCollapsed(false)} />
        <Box sx={{ flexGrow: 1, p: { xs: 2, sm: 3 } }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  )
}
