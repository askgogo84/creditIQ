'use client'

import Script from 'next/script'
import { useRef } from 'react'
import { createClient } from '@supabase/supabase-js'

export default function GoogleOneTap() {
  const buttonRef = useRef<HTMLDivElement>(null)

  async function handleCredential(response: { credential: string }) {
    try {
      // Direct client-side sign in - no custom API route needed
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
        return
      }

      if (data.session) {
        window.location.href = '/dashboard'
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
