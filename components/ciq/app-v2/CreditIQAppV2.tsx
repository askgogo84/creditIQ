'use client'

import { useEffect, useState } from 'react'
import { OnboardingJourney } from './OnboardingJourney'
import { MainExperience } from './MainExperience'

export function CreditIQAppV2() {
  const [ready, setReady] = useState(false)
  const [onboarded, setOnboarded] = useState(false)

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search)
      if (params.get('review') === 'app') {
        setOnboarded(true)
      } else if (params.get('review') === 'setup') {
        setOnboarded(false)
      } else {
        setOnboarded(localStorage.getItem('creditiq-preview-v2-onboarded') === '1')
      }
    } finally {
      setReady(true)
    }
  }, [])

  if (!ready) return <div className="ciq-v2-loading" />

  const complete = () => {
    localStorage.setItem('creditiq-preview-v2-onboarded','1')
    setOnboarded(true)
  }
  const reset = () => {
    localStorage.removeItem('creditiq-preview-v2-onboarded')
    setOnboarded(false)
  }

  return (
    <div className="ciq-v2-root">
      {!onboarded && (
        <button
          className="fixed right-3 top-[calc(10px+env(safe-area-inset-top))] z-[100] rounded-full border border-white/20 bg-black/75 px-3 py-2 text-[11px] font-extrabold text-white shadow-lg backdrop-blur-xl"
          onClick={complete}
        >
          Skip to full app
        </button>
      )}
      {onboarded ? <MainExperience onReset={reset} /> : <OnboardingJourney onComplete={complete} />}
    </div>
  )
}
