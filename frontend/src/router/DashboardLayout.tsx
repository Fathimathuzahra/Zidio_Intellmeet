import { useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  LayoutDashboard, Video, ClipboardList, Users,
  BarChart3, Search, Bell, Menu,
  UserCog, ChevronRight, PanelLeftClose, PanelLeftOpen,
} from 'lucide-react'
import { ThemeToggle } from '../components/ThemeToggle'

import { useAuthStore } from '../store/useAuthStore'
import { meetingsService } from '../services/meetings.service'

const navItems = [
  { name: 'Dashboard',          href: '/dashboard', icon: LayoutDashboard, roles: ['admin', 'member'] },
  { name: 'Meetings',           href: '/meetings',  icon: Video,           roles: ['admin', 'member'] },
  { name: 'Action Items',       href: '/tasks',     icon: ClipboardList,   roles: ['admin', 'member'] },
  { name: 'My Workspace',       href: '/my-teams',  icon: Users,           roles: ['admin', 'member'] },
  { name: 'Team Management',    href: '/teams',     icon: UserCog,         roles: ['admin', 'member'] },
  { name: 'Analytics',          href: '/analytics', icon: BarChart3,       roles: ['admin', 'member'] },
  { name: 'Profile & Settings', href: '/profile',   icon: UserCog,         roles: ['admin', 'member'] },
]

export default function DashboardLayout() {
  const location   = useLocation()
  const navigate   = useNavigate()
  const user       = useAuthStore((s) => s.user)
  const isAdmin    = useAuthStore((s) => s.isAdmin())

  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [desktopCollapsed, setDesktopCollapsed] = useState(false)
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

      <aside className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-border bg-card shadow-2xl transition-transform duration-300 lg:hidden ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <button onClick={() => navigate('/dashboard')} className="flex items-center gap-3 text-left" aria-label="Go to dashboard">
            <span className="grid h-10 w-10 place-items-center rounded-2xl gradient-primary text-white shadow-lg shadow-primary/25"><Video size={18} /></span>
            <span><span className="block text-sm font-bold text-foreground">IntellMeet</span><span className="block text-xs text-muted-foreground">Enterprise workspace</span></span>
          </button>
          <button onClick={() => setSidebarOpen(false)} className="rounded-xl p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground" aria-label="Close navigation"><ChevronRight size={18} /></button>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-5" aria-label="Primary navigation">
          {navigation.map((item) => {
            const active = location.pathname === item.href || location.pathname.startsWith(`${item.href}/`)
            return <button key={item.href} onClick={() => { navigate(item.href); setSidebarOpen(false) }} className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-semibold transition ${active ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}>
              <item.icon size={18} />{item.name}
            </button>
          })}
        </nav>
        <button onClick={() => { navigate('/profile'); setSidebarOpen(false) }} className="m-3 flex items-center gap-3 rounded-2xl border border-border bg-muted/30 p-3 text-left transition hover:bg-muted">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-primary/15 text-xs font-bold text-primary">{initials}</span>
          <span className="min-w-0"><span className="block truncate text-sm font-semibold text-foreground">{user?.name || 'Your profile'}</span><span className="block truncate text-xs text-muted-foreground">Manage account</span></span>
        </button>
      </aside>


      {/* ── Main ── */}
      <aside className={`relative z-[70] hidden shrink-0 flex-col border-r border-border/80 bg-card/95 transition-[width] duration-300 lg:flex ${desktopCollapsed ? 'w-[76px]' : 'w-64'}`}>
        <div className={`flex items-center border-b border-border py-5 ${desktopCollapsed ? 'justify-center px-3' : 'justify-between px-5'}`}>
          <button onClick={() => navigate('/dashboard')} className="flex items-center gap-3 text-left" aria-label="Go to dashboard" title={desktopCollapsed ? 'IntellMeet' : undefined}>
          <span className="grid h-10 w-10 place-items-center rounded-2xl gradient-primary text-white shadow-lg shadow-primary/25"><Video size={18} /></span>
            {!desktopCollapsed && <span><span className="block text-base font-extrabold tracking-tight text-foreground">IntellMeet</span><span className="block text-[11px] font-medium text-muted-foreground">Enterprise workspace</span></span>}
          </button>
          {!desktopCollapsed && <button onClick={() => setDesktopCollapsed(true)} className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground" aria-label="Collapse sidebar"><PanelLeftClose size={17} /></button>}
        </div>
        {desktopCollapsed && <button onClick={() => setDesktopCollapsed(false)} className="mx-auto mt-4 grid h-9 w-9 place-items-center rounded-xl border border-border text-muted-foreground transition hover:bg-muted hover:text-foreground" aria-label="Expand sidebar"><PanelLeftOpen size={17} /></button>}
        <nav className={`flex-1 space-y-1 overflow-y-auto py-5 ${desktopCollapsed ? 'px-3' : 'px-3'}`} aria-label="Primary navigation">
          {!desktopCollapsed && <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Workspace</p>}
          {navigation.map((item) => {
            const active = location.pathname === item.href || location.pathname.startsWith(`${item.href}/`)
            return <button key={item.href} onClick={() => navigate(item.href)} title={desktopCollapsed ? item.name : undefined} className={`group flex w-full items-center rounded-xl py-2.5 text-left text-sm font-semibold transition-all duration-200 ${desktopCollapsed ? 'justify-center px-2' : 'gap-3 px-3'} ${active ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}>
              <item.icon size={17} className={active ? '' : 'transition-transform group-hover:scale-110'} />{!desktopCollapsed && item.name}
            </button>
          })}
        </nav>
        <div className={`m-3 rounded-2xl border border-border bg-muted/35 p-3 ${desktopCollapsed ? 'p-2' : ''}`}>
          <button onClick={() => navigate('/profile')} title={desktopCollapsed ? 'Profile & settings' : undefined} className={`flex w-full items-center text-left ${desktopCollapsed ? 'justify-center' : 'gap-3'}`}>
            <span className="grid h-9 w-9 place-items-center rounded-full bg-primary/15 text-xs font-bold text-primary">{initials}</span>
            {!desktopCollapsed && <span className="min-w-0"><span className="block truncate text-sm font-bold text-foreground">{user?.name || 'Your profile'}</span><span className="block truncate text-xs text-muted-foreground">Profile & settings</span></span>}
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Header */}
        <header className="h-14 bg-card/95 backdrop-blur-sm border-b border-border flex items-center justify-between px-4 lg:px-6 shrink-0 gap-3 z-[60] relative">
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
        <main className="flex-1 overflow-y-auto min-w-0">
          <Outlet />
        </main>


      </div>
    </div>
  )
}
