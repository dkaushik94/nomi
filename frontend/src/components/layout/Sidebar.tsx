import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Activity, Tag, BarChart2, User } from 'lucide-react'
import { NomiLogo } from '@/components/ui/NomiLogo'
import { BETA } from '@/lib/features'
import { cn } from '@/lib/utils'

const NAV = [
  { to: '/',             icon: LayoutDashboard, label: 'Overview' },
  { to: '/transactions', icon: Activity,        label: 'Activity' },
  { to: '/tags',         icon: Tag,             label: 'Tags'     },
  ...(BETA ? [{ to: '/insights', icon: BarChart2, label: 'Insights' }] : []),
]

function NavItem({ to, icon: Icon, label }: { to: string; icon: React.ElementType; label: string }) {
  return (
    <NavLink
      to={to}
      end={to === '/'}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors',
          isActive ? 'bg-accent/10 text-accent' : 'text-muted hover:text-ink hover:bg-card',
        )
      }
    >
      <Icon size={18} />
      {label}
    </NavLink>
  )
}

export function Sidebar() {
  return (
    <aside className="hidden md:flex flex-col fixed inset-y-0 left-0 w-[240px] bg-bg border-r border-brd z-40 px-3 py-5">
      <div className="flex items-center gap-3 px-3 mb-8">
        <NomiLogo size={32} />
        <span className="font-display font-extrabold text-[22px] tracking-tight text-ink">nomi</span>
      </div>
      <nav className="flex flex-col gap-1 flex-1">
        {NAV.map((item) => <NavItem key={item.to} {...item} />)}
      </nav>
      <NavItem to="/profile" icon={User} label="Profile" />
    </aside>
  )
}
