import { GlobalHotelWorkspace } from '@/components/ciq/travel/GlobalHotelWorkspace'
import { WalletRailMatrix } from '@/components/ciq/travel/WalletRailMatrix'

export const metadata = {
  title: 'Hotels — global live inventory | CreditIQ',
  description: 'Search Indian and international hotel inventory, then layer wallet-aware redemption intelligence on supported programmes.',
}

export default function HotelsPage() {
  return (
    <>
      <GlobalHotelWorkspace />

      <section style={{ marginTop: 24 }} aria-label="Always-visible hotel redemption channels">
        <div style={{ marginBottom: 10 }}>
          <div className="ciq-editorial-kicker">Your hotel redemption routes</div>
          <h2 style={{ margin: '4px 0 4px', fontSize: 20 }}>Your card redemption paths stay visible even if a live hotel provider is unavailable.</h2>
          <p style={{ margin: 0, maxWidth: 820, color: 'var(--ink-2)', fontSize: 11 }}>
            CreditIQ shows the bank portal and loyalty routes your exact cards support. Exact property points still require a live award/property quote or direct programme checkout; provider downtime is never treated as “no redemption”.
          </p>
        </div>
        <WalletRailMatrix travelKind="hotel" programmeId={null} />
      </section>
    </>
  )
}
