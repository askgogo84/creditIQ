import { GlobalHotelWorkspace } from '@/components/ciq/travel/GlobalHotelWorkspace'
import { HotelWalletRedemptionDiscovery } from '@/components/ciq/travel/HotelWalletRedemptionDiscovery'

export const metadata = {
  title: 'Hotels — global live inventory | CreditIQ',
  description: 'Search Indian and international hotel inventory, then layer wallet-aware redemption intelligence on supported programmes.',
}

export default function HotelsPage() {
  return (
    <>
      <GlobalHotelWorkspace />
      <HotelWalletRedemptionDiscovery />
    </>
  )
}
