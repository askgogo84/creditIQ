'use client'

import Script from 'next/script'
import { useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'

// Google One Tap — personalized sign-in button
// Shows user's name + photo + email if they're already logged into Google
// Replaces the boring grey "Sign in with Google" button

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
        // Redirect to dashboard after successful sign-in
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
      auto_select: true,              // auto-selects if only 1 account
      cancel_on_tap_outside: false,   // keeps One Tap prompt visible
    })

    // Render the personalized button
    google.accounts.id.renderButton(buttonRef.current, {
      type: 'standard',
      theme: 'outline',
      size: 'large',
      shape: 'rectangular',
      text: 'continue_with',
      logo_alignment: 'left',
      width: buttonRef.current.offsetWidth || 320,
    })

    // This is the key call — shows the One Tap prompt with their photo/email
    google.accounts.id.prompt((notification: any) => {
      if (notification.isNotDisplayed()) {
        console.log('One Tap not displayed:', notification.getNotDisplayedReason())
      }
    })
  }

  return (
    <>
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onLoad={onLoad}
      />
      {/* The div Google replaces with the personalized button */}
      <div ref={buttonRef} className="w-full" />
    </>
  )
}
