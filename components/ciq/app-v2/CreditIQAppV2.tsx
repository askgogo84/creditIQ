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
        <button className="ciq-v2-review-skip" onClick={complete}>
          Skip to full app
        </button>
      )}
      {onboarded ? <MainExperience onReset={reset} /> : <OnboardingJourney onComplete={complete} />}
    </div>
  )
}
