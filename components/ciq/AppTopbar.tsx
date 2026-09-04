'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Bell, Search, Sparkles, Sun, Moon } from 'lucide-react'
import { APP_NAV } from '@/components/ciq/appNav'
import { useTheme } from '@/lib/store'

const COMMANDS = [
  { words: ['dashboard', 'home', 'overview'], href: '/dashboard' },
  { words: ['wallet', 'balance', 'statement'], href: '/wallet' },
  { words: ['spend', 'merchant', 'optimizer', 'optimise'], href: '/spend-optimizer' },
  { words: ['travel', 'flight', 'hotel', 'award', 'lounge'], href: '/trip-planner' },
  { words: ['card', 'cards', 'compare'], href: '/cards' },
  { words: ['cira', 'concierge', 'assistant', 'ai'], href: '/cira' },
  { words: ['profile', 'account', 'billing'], href: '/profile' },
] as const

function currentLabel(pathname: string): string {
  return APP_NAV.find(item => item.match(pathname))?.label ?? 'CreditIQ'
}

export function AppTopbar() {
  const pathname = usePathname() || '/dashboard'
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState('')
  const theme = useTheme(state => state.theme)
  const toggleTheme = useTheme(state => state.toggle)

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

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const needle = query.trim().toLowerCase()
    if (!needle) return
    const target = COMMANDS.find(command => command.words.some(word => needle.includes(word) || word.includes(needle)))
    router.push(target?.href ?? `/cards?q=${encodeURIComponent(needle)}`)
    setQuery('')
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
        <button type="button" className="ciq-app-icon ciq-app-notifications" aria-label="Notifications">
          <Bell size={18} strokeWidth={1.8} />
          <span aria-hidden />
        </button>
        <Link href="/cira" className="ciq-ask-cira">
          <Sparkles size={16} strokeWidth={1.9} aria-hidden />
          <span>Ask CIRA</span>
        </Link>
      </div>
    </header>
  )
}
