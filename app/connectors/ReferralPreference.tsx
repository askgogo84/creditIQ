
'use client'

import { useEffect, useState } from 'react'

export function ReferralPreference() {
  const [enabled, setEnabled] = useState<boolean>()
  useEffect(() => {
    try { setEnabled(localStorage.getItem('creditiq-connector-metrics') !== 'off') } catch {}
  }, [])

  if (enabled === undefined) return null
  return <label className="mb-5 flex items-center gap-2">
    <input type="checkbox" checked={enabled} onChange={event => {
      try {
        localStorage.setItem('creditiq-connector-metrics', event.target.checked ? 'on' : 'off')
        setEnabled(event.target.checked)
      } catch {}
    }} />
    Count my CreditIQ connector referrals in aggregate
  </label>
}
