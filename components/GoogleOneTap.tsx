'use client'

import Script from 'next/script'
import { useRef } from 'react'
import { createClient } from '@supabase/supabase-js'

export default function GoogleOneTap() {
  const buttonRef = useRef<HTMLDivElement>(null)

  async function handleCredential(response: { credential: string }) {
    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )

      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: response.credential,
      })

      if (error) {
        console.error('Sign in error:', error.message)
        alert('Sign in failed: ' + error.message)
        return
      }

      if (data.session) {
        setTimeout(() => { window.location.href = '/dashboard' }, 500)
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
      auto_select: false,           // disable auto-select to avoid FedCM rate limiting
      cancel_on_tap_outside: true,
      use_fedcm_for_prompt: false,  // force classic One Tap, not FedCM
    })

    // Only render button — don't call prompt() which triggers FedCM
    google.accounts.id.renderButton(buttonRef.current, {
      type: 'standard',
      theme: 'outline',
      size: 'large',
      shape: 'rectangular',
      text: 'continue_with',
      logo_alignment: 'left',
      width: buttonRef.current.offsetWidth || 320,
    })
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
