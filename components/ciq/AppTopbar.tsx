'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Bell, Search, Sparkles, Sun, Moon } from 'lucide-react'
import { APP_NAV } from '@/components/ciq/appNav'
import { useTheme } from '@/lib/store'
import { authedFetch } from '@/lib/authed-fetch'

const COMMANDS = [
  { words: ['dashboard', 'home', 'overview'], href: '/dashboard' },
  { words: ['wallet', 'balance', 'statement'], href: '/wallet' },
  { words: ['spend', 'merchant', 'optimizer', 'optimise'], href: '/spend-optimizer' },
  { words: ['travel', 'flight', 'hotel', 'award', 'lounge', 'dream', 'watch'], href: '/trip-planner' },
  { words: ['card', 'cards', 'compare'], href: '/cards' },
  { words: ['cira', 'concierge', 'assistant', 'ai'], href: '/cira' },
  { words: ['profile', 'account', 'billing'], href: '/profile' },
] as const

type Notification = {
  id: string
  type: string
  title: string
  body: string
  href: string | null
  severity: 'INFO' | 'OPPORTUNITY' | 'WARNING' | 'URGENT'
  read_at: string | null
  created_at: string
}

function currentLabel(pathname: string): string {
  return APP_NAV.find(item => item.match(pathname))?.label ?? 'CreditIQ'
}

export function AppTopbar() {
  const pathname = usePathname() || '/dashboard'
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const notificationRef = useRef<HTMLDivElement>(null)
  const [query, setQuery] = useState('')
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const theme = useTheme(state => state.theme)
  const toggleTheme = useTheme(state => state.toggle)

  async function loadNotifications() {
    try {
      const res = await authedFetch('/api/notifications?limit=8')
      const data = await res.json().catch(() => ({}))
      if (!res.ok) return
      setNotifications(Array.isArray(data.notifications) ? data.notifications : [])
      setUnreadCount(Number(data.unread_count) || 0)
    } catch {
      // A notification failure must never break navigation chrome.
    }
  }

  useEffect(() => {
    void loadNotifications()
    const timer = window.setInterval(() => void loadNotifications(), 60_000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        inputRef.current?.focus()
        inputRef.current?.select()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [])

  useEffect(() => {
    if (!notificationsOpen) return
    const onPointer = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) setNotificationsOpen(false)
    }
    document.addEventListener('mousedown', onPointer)
    return () => document.removeEventListener('mousedown', onPointer)
  }, [notificationsOpen])

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const needle = query.trim().toLowerCase()
    if (!needle) return
    const target = COMMANDS.find(command => command.words.some(word => needle.includes(word) || word.includes(needle)))
    router.push(target?.href ?? `/cards?q=${encodeURIComponent(needle)}`)
    setQuery('')
  }

  async function openNotification(item: Notification) {
    if (!item.read_at) {
      setNotifications(current => current.map(n => n.id === item.id ? { ...n, read_at: new Date().toISOString() } : n))
      setUnreadCount(current => Math.max(0, current - 1))
      void authedFetch('/api/notifications', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: item.id }),
      })
    }
    setNotificationsOpen(false)
    if (item.href) router.push(item.href)
  }

  async function markAllRead() {
    setNotifications(current => current.map(n => ({ ...n, read_at: n.read_at || new Date().toISOString() })))
    setUnreadCount(0)
    await authedFetch('/api/notifications', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ all: true }),
    }).catch(() => null)
  }

  return (
    <header className="ciq-app-topbar">
      <div className="ciq-app-crumb" aria-label="Current location">
        <span>CreditIQ</span>
        <strong>{currentLabel(pathname)}</strong>
      </div>

      <form className="ciq-app-search" role="search" onSubmit={submit}>
        <Search size={17} strokeWidth={1.8} aria-hidden />
        <input
          ref={inputRef}
          value={query}
          onChange={event => setQuery(event.target.value)}
          aria-label="Search CreditIQ"
          placeholder="Search cards, programmes, benefits…"
        />
        <kbd>⌘ K</kbd>
      </form>

      <div className="ciq-app-actions">
        <button type="button" className="ciq-app-icon" onClick={toggleTheme} aria-label="Switch light or dark theme">
          {theme === 'dark' ? <Moon size={18} strokeWidth={1.8} /> : <Sun size={18} strokeWidth={1.8} />}
        </button>
        <div ref={notificationRef} style={{ position: 'relative' }}>
          <button
            type="button"
            className="ciq-app-icon ciq-app-notifications"
            aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ''}`}
            aria-expanded={notificationsOpen}
            onClick={() => {
              setNotificationsOpen(open => !open)
              if (!notificationsOpen) void loadNotifications()
            }}
          >
            <Bell size={18} strokeWidth={1.8} />
            {unreadCount > 0 && (
              <span aria-hidden style={{
                position: 'absolute', right: -4, top: -5, minWidth: 17, height: 17, padding: '0 4px', borderRadius: 999,
                display: 'grid', placeItems: 'center', background: 'var(--copper)', color: '#fff', fontSize: 8, fontWeight: 850,
                border: '2px solid var(--paper)', lineHeight: 1,
              }}>{unreadCount > 9 ? '9+' : unreadCount}</span>
            )}
          </button>

          {notificationsOpen && (
            <div style={{
              position: 'absolute', right: 0, top: 'calc(100% + 10px)', width: 360, maxHeight: 'min(560px, calc(100vh - 90px))',
              overflow: 'auto', zIndex: 400, border: '1px solid var(--line)', borderRadius: 14, background: 'var(--paper)',
              boxShadow: '0 22px 60px rgba(5,17,30,.18)', color: 'var(--ink)',
            }}>
              <div style={{ position: 'sticky', top: 0, zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '12px 13px', borderBottom: '1px solid var(--line)', background: 'var(--paper)' }}>
                <div><b style={{ fontSize: 12 }}>Notifications</b><small style={{ display: 'block', marginTop: 2, color: 'var(--muted)', fontSize: 9 }}>{unreadCount ? `${unreadCount} unread` : 'You’re caught up'}</small></div>
                {unreadCount > 0 && <button type="button" onClick={() => void markAllRead()} style={{ border: 0, background: 'transparent', color: 'var(--copper)', fontSize: 9, fontWeight: 750, cursor: 'pointer' }}>Mark all read</button>}
              </div>
              {notifications.length === 0 ? (
                <div style={{ padding: 24, textAlign: 'center', color: 'var(--muted)', fontSize: 10.5 }}>No notifications yet. Dream Trip watches will surface meaningful changes here.</div>
              ) : notifications.map(item => (
                <button key={item.id} type="button" onClick={() => void openNotification(item)} style={{
                  width: '100%', display: 'grid', gridTemplateColumns: '8px 1fr', gap: 9, padding: '12px 13px', textAlign: 'left',
                  border: 0, borderBottom: '1px solid var(--line-soft)', background: item.read_at ? 'transparent' : 'var(--paper-soft)', color: 'var(--ink)', cursor: 'pointer',
                }}>
                  <span style={{ width: 7, height: 7, marginTop: 5, borderRadius: 99, background: item.read_at ? 'var(--line-strong)' : item.severity === 'URGENT' ? 'var(--red)' : item.severity === 'WARNING' ? 'var(--amber)' : item.severity === 'OPPORTUNITY' ? 'var(--green)' : 'var(--copper)' }} />
                  <span><b style={{ display: 'block', fontSize: 10.5, lineHeight: 1.35 }}>{item.title}</b><span style={{ display: 'block', marginTop: 4, color: 'var(--muted)', fontSize: 9.5, lineHeight: 1.45 }}>{item.body}</span><small style={{ display: 'block', marginTop: 5, color: 'var(--subtle)', fontSize: 8 }}>{new Date(item.created_at).toLocaleString()}</small></span>
                </button>
              ))}
              <div style={{ padding: '9px 12px', color: 'var(--subtle)', fontSize: 8.5, lineHeight: 1.45 }}>Watch alerts are discovery signals. Open the relevant Travel flow for live verification before transferring points or booking.</div>
            </div>
          )}
        </div>
        <Link href="/cira" className="ciq-ask-cira">
          <Sparkles size={16} strokeWidth={1.9} aria-hidden />
          <span>Ask CIRA</span>
        </Link>
      </div>
    </header>
  )
}
