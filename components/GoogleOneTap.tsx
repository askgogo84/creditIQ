'use client'

import Script from 'next/script'
import { useRef } from 'react'
import { useRouter } from 'next/navigation'

export default function GoogleOneTap() {
  const buttonRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  async function handleCredential(response: { credential: string }) {
    try {
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: response.credential }),
      })
      if (!res.ok) throw new Error('Auth failed')
      const data = await res.json()
      if (data.ok) {
        router.push('/dashboard')
        router.refresh()
      }
    } catch (err) {
      console.error('Google sign-in error:', err)
    }
  }

  function onLoad() {
    const google = (window as any).google
    if (!google || !buttonRef.current) return

    google.accounts.id.initialize({
      client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
      callback: handleCredential,
      auto_select: true,
      cancel_on_tap_outside: false,
    })

    google.accounts.id.renderButton(buttonRef.current, {
      type: 'standard',
      theme: 'outline',
      size: 'large',
      shape: 'rectangular',
      text: 'continue_with',
      logo_alignment: 'left',
      width: buttonRef.current.offsetWidth || 320,
    })

    google.accounts.id.prompt()
  }

  return (
    <>
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onLoad={onLoad}
      />
      <div ref={buttonRef} className="w-full" />
    </>
  )
}
