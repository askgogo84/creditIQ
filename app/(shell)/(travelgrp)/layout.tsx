import { TravelWorkspaceShell } from '@/components/ciq/travel/TravelWorkspaceShell'

// Travel has two primary jobs — Flights and Hotels — with the existing intelligence
// tools kept as secondary links. This layout is deliberately presentation-only: all
// child pages retain their existing API calls, authentication and data engines.
export default function TravelLayout({ children }: { children: React.ReactNode }) {
  return <TravelWorkspaceShell>{children}</TravelWorkspaceShell>
}
