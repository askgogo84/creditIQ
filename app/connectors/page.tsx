
import type { Metadata } from 'next'
import Link from 'next/link'
import { ReferralPreference } from './ReferralPreference'

export const metadata: Metadata = {
  title: 'CreditIQ connectors',
  description: 'Use CreditIQ card comparisons and dated rewards evidence in MCP-compatible assistants.',
}

export default function ConnectorsPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-14">
      <h1 className="mb-4 text-3xl font-semibold">CreditIQ connectors</h1>
      <p className="mb-5">Search Indian credit cards, compare fees, estimate rewards and check dated lounge and redemption terms in an MCP-compatible assistant.</p>
      <p className="mb-4">Public card queries work without a CreditIQ account when the connector is enabled. Your assistant sends the selected card names, preferences and spending estimates to CreditIQ. Use rounded spending estimates and keep statements, card numbers and credentials out of chat.</p>
      <p className="mb-4">CreditIQ uses short-lived security counters to limit abuse. Connector diagnostics record tool names, result categories, timing and distribution channel without storing tool inputs, response contents or linked account identifiers. Referral links carry the distribution channel. You can turn aggregate referral counts off on this browser.</p>
      <p className="mb-4">If your platform offers account linking, review the permissions before consenting. Disconnect from the assistant’s connector settings and revoke the grant in the identity provider’s connected-app settings. For privacy and deletion requests, contact <a href="mailto:privacy@creditiq.app">privacy@creditiq.app</a>.</p>
      <p className="mb-4">Reward estimates and recorded benefits depend on current issuer terms. CreditIQ may earn compensation from selected application links on its website.</p>
      <ReferralPreference />
      <nav className="flex flex-wrap gap-4 underline" aria-label="CreditIQ connector resources">
        <Link href="/cards">Browse cards</Link>
        <Link href="/privacy">Privacy policy</Link>
        <Link href="/terms">Terms of service</Link>
        <a href="mailto:support@creditiq.app">Connector support</a>
      </nav>
    </main>
  )
}
