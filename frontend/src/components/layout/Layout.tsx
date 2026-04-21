import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { BottomNav } from './BottomNav'
import { TopBar } from './TopBar'

export default function Layout() {
  return (
    <div className="flex min-h-dvh bg-bg">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 md:ml-[240px]">
        <TopBar />
        <main className="flex-1 overflow-y-auto pb-[calc(64px+env(safe-area-inset-bottom,0px))] md:pb-0">
          <Outlet />
        </main>
      </div>
      <BottomNav />
    </div>
  )
}
