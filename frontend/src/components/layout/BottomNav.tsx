import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Activity, Tag, BarChart2, UserCircle } from 'lucide-react'
import { BETA } from '@/lib/features'
import { cn } from '@/lib/utils'

const NAV = [
  { to: '/',             icon: LayoutDashboard, label: 'Overview' },
  { to: '/transactions', icon: Activity,        label: 'Activity' },
  { to: '/tags',         icon: Tag,             label: 'Tags'     },
  ...(BETA ? [{ to: '/insights', icon: BarChart2, label: 'Insights' }] : []),
  { to: '/profile',      icon: UserCircle,      label: 'Profile'  },
]

export function BottomNav() {
  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-40 flex items-center bg-bg border-t border-brd"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)', height: 'calc(64px + env(safe-area-inset-bottom, 0px))' }}
    >
      {NAV.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          className={({ isActive }) =>
            cn(
              'flex-1 flex flex-col items-center justify-center gap-0.5 pt-2 transition-colors',
              isActive ? 'text-accent' : 'text-faint',
            )
          }
        >
          <Icon size={22} />
          <span className="text-[10px] font-semibold">{label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
