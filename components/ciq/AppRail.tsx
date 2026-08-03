'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { APP_NAV, appActive } from '@/components/ciq/appNav'
import { useTheme } from '@/lib/store'

// AppRail — the fixed left sidebar shown to SIGNED-IN users at >=900px. Below
// that, NavShell hides it and shows the existing ciq TabBar instead. Plain white
// ground; app design tokens only, no new colour. Gated on auth state (NavShell),
// never on route, so the public crawlable (shell) pages keep the untouched
// Header for visitors.
const RAIL_W = 248

const eyebrow: React.CSSProperties = {
  fontSize: 10, fontWeight: 700, letterSpacing: '1.6px', textTransform: 'uppercase',
  color: 'var(--copper)',
}

// One primary destination row.
const navRow = (active: boolean): React.CSSProperties => ({
  display: 'flex', alignItems: 'center', gap: 12, width: '100%',
  padding: '10px 12px', borderRadius: 12, textDecoration: 'none',
  fontSize: 14.5, fontWeight: 600, fontFamily: 'inherit', position: 'relative',
  color: active ? 'var(--copper)' : 'var(--ink-2)',
  background: active ? 'var(--bg-2)' : 'transparent',
  border: '1px solid ' + (active ? 'var(--line)' : 'transparent'),
  transition: 'background 0.12s, color 0.12s',
})

export function AppRail() {
  const path = usePathname()
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  // Theme is owned by the single store writer (lib/store.ts) — read it, never
  // mirror it into local state, so this toggle's icon can never disagree with the
  // actual site theme. See lib/theme-single-writer.test.ts.
  const theme = useTheme((s) => s.theme)
  const toggleTheme = useTheme((s) => s.toggle)

  useEffect(() => {
    const sb = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
    sb.auth.getSession().then(({ data: { session } }) => setUser(session?.user ?? null))
    const { data: { subscription } } = sb.auth.onAuthStateChange((_e, session) => setUser(session?.user ?? null))
    return () => subscription.unsubscribe()
  }, [])

  const signOut = async () => {
    const sb = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
    await sb.auth.signOut()
    router.push('/')
  }

  const name =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    (user?.email ? user.email.split('@')[0] : 'Your account')
  const email = user?.email || ''

  return (
    <aside
      className="ciq-shell-rail"
      style={{
        position: 'fixed', top: 0, left: 0, bottom: 0, width: RAIL_W, zIndex: 200,
        background: 'var(--surface)', borderRight: '1px solid var(--line)',
        display: 'flex', flexDirection: 'column',
      }}
    >
      {/* Wordmark + eyebrow */}
      <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', padding: '18px 18px 16px', flexShrink: 0 }}>
        <div style={{ width: 36, height: 36, background: 'var(--navy)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <rect x="1" y="4" width="22" height="16" rx="3" fill="white" fillOpacity="0.9" />
            <line x1="1" y1="10" x2="23" y2="10" stroke="#142950" strokeWidth="2" />
            <circle cx="5" cy="14.5" r="1.5" fill="#C9972E" />
          </svg>
        </div>
        <div>
          <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--ink)', letterSpacing: '-0.5px', lineHeight: 1 }}>CreditIQ</div>
          <div style={{ ...eyebrow, fontSize: 9, letterSpacing: '2px', marginTop: 3 }}>Intelligence</div>
        </div>
      </Link>

      {/* Scroll region: primary nav + grouped tools */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: '4px 12px 12px', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {APP_NAV.map(item => {
          const active = appActive(item.href, path)
          return (
            <Link key={item.href} href={item.href} style={navRow(active)}>
              {active && <span style={{ position: 'absolute', left: -12, top: '50%', transform: 'translateY(-50%)', width: 3, height: 20, borderRadius: 3, background: 'var(--copper)' }} />}
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
                {item.icon(active ? 'var(--copper)' : 'currentColor')}
              </svg>
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Pinned footer: identity, theme toggle, sign out */}
      <div style={{ flexShrink: 0, borderTop: '1px solid var(--line)', padding: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 6px 10px', minWidth: 0 }}>
          <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--bg-2)', color: 'var(--copper)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, flexShrink: 0, textTransform: 'uppercase' }}>
            {(name || 'U').slice(0, 1)}
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</div>
            {email && <div style={{ fontSize: 11, color: 'var(--ink-3)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{email}</div>}
          </div>
        </div>

        {/* Theme toggle */}
        <button type="button" onClick={toggleTheme} aria-label="Toggle light or dark theme" style={{
          display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '9px 12px', marginBottom: 4,
          borderRadius: 10, border: '1px solid transparent', background: 'transparent', cursor: 'pointer',
          fontFamily: 'inherit', fontSize: 13, fontWeight: 600, color: 'var(--ink-2)', textAlign: 'left',
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
            {theme === 'dark'
              ? <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              : <><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></>}
          </svg>
          <span style={{ flex: 1 }}>{theme === 'dark' ? 'Dark mode' : 'Light mode'}</span>
        </button>

        {/* Sign out */}
        <button type="button" onClick={signOut} style={{
          display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '9px 12px',
          borderRadius: 10, border: '1px solid transparent', background: 'transparent', cursor: 'pointer',
          fontFamily: 'inherit', fontSize: 13, fontWeight: 600, color: 'var(--ink-2)', textAlign: 'left',
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
          </svg>
          <span style={{ flex: 1 }}>Sign out</span>
        </button>
      </div>
    </aside>
  )
}
