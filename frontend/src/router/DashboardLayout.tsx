import { useState } from 'react'
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  LayoutDashboard, Video, ClipboardList, Users,
  BarChart3, LogOut, Search, Bell, Menu, X,
  UserCog, ChevronRight, Sparkles,
} from 'lucide-react'
import { ThemeToggle } from '../components/ThemeToggle'
import { useLogout } from '../hooks/useLogout'
import { useAuthStore } from '../store/useAuthStore'
import { meetingsService } from '../services/meetings.service'

const navItems = [
  { name: 'Dashboard',        href: '/dashboard', icon: LayoutDashboard, roles: ['admin', 'member'] },
  { name: 'Meetings',         href: '/meetings',  icon: Video,           roles: ['admin', 'member'] },
  { name: 'Action Items',     href: '/tasks',     icon: ClipboardList,   roles: ['admin', 'member'] },
  { name: 'My Workspace',     href: '/my-teams',  icon: Users,           roles: ['member'] },
  { name: 'Team Management',  href: '/teams',     icon: UserCog,         roles: ['admin'] },
  { name: 'Analytics',        href: '/analytics', icon: BarChart3,       roles: ['admin'] },
]

export default function DashboardLayout() {
  const location   = useLocation()
  const navigate   = useNavigate()
  const logout     = useLogout()
  const user       = useAuthStore((s) => s.user)
  const isAdmin    = useAuthStore((s) => s.isAdmin())

  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [notifOpen,   setNotifOpen]   = useState(false)
  const [search,      setSearch]      = useState('')
  const [readIds,     setReadIds]     = useState<Set<string>>(new Set())

  const navigation = navItems.filter((item) =>
    isAdmin ? item.roles.includes('admin') : item.roles.includes('member')
  )

  const { data: meetings = [] } = useQuery({
    queryKey: ['meetings'],
    queryFn: meetingsService.getAll,
    enabled: !!user,
  })

  const notifications = [
    ...meetings.filter((m) => m.status === 'active')
      .map((m) => ({ id: `active-${m._id}`, text: `"${m.title}" is live now`, time: 'Now', unread: true })),
    ...meetings.filter((m) => m.status === 'ended' && m.summary).slice(0, 2)
      .map((m) => ({ id: `summary-${m._id}`, text: `AI summary ready for "${m.title}"`, time: 'Recent', unread: !readIds.has(`summary-${m._id}`) })),
    ...meetings.filter((m) => m.status === 'scheduled').slice(0, 1)
      .map((m) => ({ id: `sched-${m._id}`, text: `"${m.title}" is scheduled`, time: m.scheduledAt ? new Date(m.scheduledAt).toLocaleDateString() : 'Upcoming', unread: false })),
  ].slice(0, 5)

  const unreadCount = notifications.filter((n) => n.unread && !readIds.has(n.id)).length
  const initials    = user?.name ? user.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() : 'U'
  const currentPage = navigation.find((n) => location.pathname === n.href || location.pathname.startsWith(n.href + '/'))

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && search.trim()) {
      navigate(`/meetings?search=${encodeURIComponent(search)}`)
      setSearch('')
    }
  }

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-background/70 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ── */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 flex flex-col
        bg-sidebar border-r border-sidebar-border
        transition-transform duration-300 ease-in-out
        lg:translate-x-0 lg:static lg:inset-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Logo */}
        <div className="flex items-center justify-between px-5 py-5 border-b border-sidebar-border shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl gradient-primary flex items-center justify-center shadow-md glow-sm shrink-0">
              <Video size={15} className="text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight text-sidebar-foreground">IntellMeet</span>
          </div>
          <button className="lg:hidden text-muted-foreground hover:text-foreground transition-colors p-1" onClick={() => setSidebarOpen(false)}>
            <X size={18} />
          </button>
        </div>

        {/* Role badge */}
        <div className="mx-4 mt-3 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/15 flex items-center justify-between shrink-0">
          <span className="text-[11px] font-medium text-primary/80">Role</span>
          <span className="text-[11px] font-bold text-primary uppercase tracking-wide">
            {isAdmin ? 'Administrator' : 'Team Member'}
          </span>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto no-scrollbar">
          {navigation.map((item) => {
            const active = location.pathname === item.href || location.pathname.startsWith(item.href + '/')
            return (
              <Link
                key={item.name}
                to={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group ${
                  active
                    ? 'gradient-primary text-white shadow-md glow-sm'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                }`}
              >
                <item.icon size={17} className={active ? 'text-white' : ''} />
                <span className="flex-1">{item.name}</span>
                {active && <div className="w-1.5 h-1.5 rounded-full bg-white/70" />}
              </Link>
            )
          })}
        </nav>

        {/* AI Badge */}
        <div className="mx-4 mb-3 p-3 rounded-xl bg-gradient-to-br from-primary/10 to-violet-500/10 border border-primary/20 shrink-0">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles size={13} className="text-primary" />
            <span className="text-xs font-bold text-foreground">AI-Powered</span>
          </div>
          <p className="text-[11px] text-muted-foreground leading-snug">
            Auto-summaries and action items after every meeting.
          </p>
        </div>

        {/* User + Logout */}
        <div className="p-3 border-t border-sidebar-border space-y-1 shrink-0">
          <button
            onClick={() => navigate('/profile')}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-sidebar-accent transition-colors group text-left"
          >
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold shrink-0 group-hover:bg-primary/30 transition-colors">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-sidebar-foreground truncate">{user?.name ?? 'User'}</p>
              <p className="text-[10px] text-muted-foreground truncate">{user?.email ?? ''}</p>
            </div>
            <ChevronRight size={13} className="text-muted-foreground/50 shrink-0" />
          </button>
          <button
            onClick={logout}
            className="flex w-full items-center gap-3 px-3 py-2.5 text-sm font-medium text-destructive hover:bg-destructive/8 rounded-xl transition-colors"
          >
            <LogOut size={16} />
            Sign out
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Header */}
        <header className="h-14 bg-card/80 backdrop-blur-sm border-b border-border flex items-center justify-between px-4 lg:px-6 shrink-0 gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <button
              className="lg:hidden p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors shrink-0"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={20} />
            </button>

            {/* Breadcrumb */}
            <div className="hidden lg:flex items-center gap-1.5 text-sm shrink-0">
              <span className="text-muted-foreground font-medium">IntellMeet</span>
              <ChevronRight size={13} className="text-muted-foreground/50" />
              <span className="font-semibold text-foreground">{currentPage?.name ?? 'Page'}</span>
            </div>

            {/* Search */}
            <div className="relative hidden sm:block w-full max-w-64 lg:ml-2">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={handleSearch}
                placeholder="Search meetings..."
                className="w-full h-9 bg-background/80 border border-input rounded-xl py-2 px-4 pl-9 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary/50 transition-all"
              />
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <ThemeToggle />

            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setNotifOpen(!notifOpen)}
                className="relative w-9 h-9 rounded-xl hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
              >
                <Bell size={17} />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-primary text-primary-foreground text-[9px] font-bold flex items-center justify-center border-2 border-card animate-pulse-glow">
                    {unreadCount}
                  </span>
                )}
              </button>

              {notifOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setNotifOpen(false)} />
                  <div className="absolute right-0 mt-2 w-80 bg-card border border-border rounded-2xl shadow-2xl z-50 overflow-hidden animate-slide-up">
                    <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Bell size={14} className="text-primary" />
                        <span className="font-semibold text-sm text-foreground">Notifications</span>
                      </div>
                      {unreadCount > 0 && (
                        <button
                          className="text-xs text-primary font-medium hover:underline underline-offset-4"
                          onClick={() => setReadIds(new Set(notifications.map((n) => n.id)))}
                        >
                          Mark all read
                        </button>
                      )}
                    </div>
                    <div className="divide-y divide-border max-h-72 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-10 gap-2 text-muted-foreground">
                          <Bell size={22} className="opacity-30" />
                          <p className="text-xs">No notifications yet</p>
                        </div>
                      ) : notifications.map((n) => {
                        const isUnread = n.unread && !readIds.has(n.id)
                        return (
                          <button
                            key={n.id}
                            className={`w-full flex items-start gap-3 px-4 py-3 hover:bg-muted/40 transition-colors text-left ${isUnread ? 'bg-primary/5' : ''}`}
                            onClick={() => { setReadIds((p) => new Set([...p, n.id])); navigate('/meetings'); setNotifOpen(false) }}
                          >
                            <span className={`w-2 h-2 rounded-full shrink-0 mt-1.5 ${isUnread ? 'bg-primary animate-pulse' : 'bg-transparent'}`} />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-foreground leading-snug">{n.text}</p>
                              <p className="text-[10px] text-muted-foreground mt-0.5">{n.time}</p>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                    <div className="px-4 py-2.5 border-t border-border">
                      <button className="text-xs text-primary font-medium hover:underline w-full text-center">
                        View all notifications
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Avatar */}
            <button
              onClick={() => navigate('/profile')}
              className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold border-2 border-background shadow-sm hover:bg-primary/30 transition-colors"
            >
              {initials}
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-7">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
