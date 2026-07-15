import { NavShell } from '@/components/NavShell'

// (shell) route group layout — the single home for the app nav chrome.
//
// Phase 0: no pages live under (shell) yet, so this layout is inert but compiles
// and is ready to receive pages in later phases. As pages move into
// app/(shell)/, they inherit <NavShell /> here and drop their own <Header />.
//
// Chromeless routes (login, admin, admin/cards) stay OUTSIDE this group so they
// never render the app nav.
export default function ShellLayout({ children }: { children: React.ReactNode }) {
  return <NavShell>{children}</NavShell>
}
