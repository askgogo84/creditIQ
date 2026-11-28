
'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { taggedReferral } from '@/lib/mcp/referrals'

let lastTaggedLocation = ''
const preferenceKey = 'creditiq-connector-metrics'

export function ConnectorReferral() {
  const path = usePathname()
  useEffect(() => {
    const channel = taggedReferral(new URLSearchParams(window.location.search))
    if (!channel) {
      lastTaggedLocation = ''
      return
    }
    const nav = navigator as Navigator & { globalPrivacyControl?: boolean }
    if (nav.globalPrivacyControl || nav.doNotTrack === '1') return
    try {
      if (window.localStorage.getItem(preferenceKey) === 'off') return
    } catch {
      return
    }
    const location = path + ':' + channel
    if (lastTaggedLocation === location) return
    lastTaggedLocation = location
    void fetch('/connectors/referral/' + channel, {
      method: 'POST', credentials: 'omit', referrerPolicy: 'no-referrer', keepalive: true,
    }).catch(() => {})
  }, [path])
  return null
}
