import { Header } from '@/components/Header'

// NavShell — the canonical nav chrome wrapper for the app.
//
// Phase 0 of the unified-nav migration: this promotes the existing <Header />
// into a reusable shell that renders the nav once and slots page content beneath
// it. The (shell) route group's layout renders <NavShell> around its children so
// pages moved into the group get the nav for free and can drop their own
// per-page <Header /> import.
//
// Nothing is moved into the shell yet — this only establishes the surface. The
// Header re-export keeps a single source of truth so existing per-page imports
// and NavShell resolve to the same component.
export function NavShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      {children}
    </>
  )
}

export { Header }
