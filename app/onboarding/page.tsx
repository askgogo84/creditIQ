'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const STEPS = [
  {
    id: 'spend',
    title: 'What do you spend most on?',
    subtitle: 'Pick all that apply — we\'ll find cards that maximise every rupee',
    type: 'multi',
    options: [
      { id: 'shopping', label: '🛍️ Online Shopping', sub: 'Amazon, Flipkart, Myntra' },
      { id: 'dining', label: '🍽️ Dining & Food Delivery', sub: 'Swiggy, Zomato, restaurants' },
      { id: 'travel', label: '✈️ Travel & Hotels', sub: 'Flights, hotels, cabs' },
      { id: 'fuel', label: '⛽ Fuel', sub: 'Petrol & diesel' },
      { id: 'groceries', label: '🛒 Groceries', sub: 'BigBasket, supermarkets' },
      { id: 'utility', label: '💡 Bills & Utilities', sub: 'Electricity, mobile recharges' },
    ]
  },
  {
    id: 'monthly',
    title: 'Monthly credit card spend?',
    subtitle: 'This helps us calculate your actual rewards earnings',
    type: 'single',
    options: [
      { id: '10k', label: 'Under ₹10,000', sub: 'Light spender' },
      { id: '25k', label: '₹10,000 – ₹25,000', sub: 'Moderate' },
      { id: '50k', label: '₹25,000 – ₹50,000', sub: 'Regular' },
      { id: '1L', label: '₹50,000 – ₹1,00,000', sub: 'Heavy spender' },
      { id: '1L+', label: 'Over ₹1,00,000', sub: 'Premium segment' },
    ]
  },
  {
    id: 'goal',
    title: 'What\'s your primary goal?',
    subtitle: 'We\'ll optimise your recommendation around this',
    type: 'single',
    options: [
      { id: 'cashback', label: '💰 Maximum cashback', sub: 'Money back on every spend' },
      { id: 'travel', label: '🌏 Free flights & hotels', sub: 'Points & miles strategy' },
      { id: 'lounge', label: '🛋️ Airport lounge access', sub: 'Travel comfort' },
      { id: 'simple', label: '✅ Simple, no-fee card', sub: 'No annual fee ever' },
    ]
  }
]

export default function OnboardingFlow() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({})
  const [selected, setSelected] = useState<string[]>([])

  const current = STEPS[step]
  const isLast = step === STEPS.length - 1

  function toggle(id: string) {
    if (current.type === 'single') {
      setSelected([id])
    } else {
      setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
    }
  }

  function next() {
    const val = current.type === 'single' ? selected[0] : selected
    setAnswers(prev => ({ ...prev, [current.id]: val }))
    setSelected([])
    if (isLast) {
      // Build CIRA query from answers
      const a = { ...answers, [current.id]: val }
      const query = `I spend mainly on ${(a.spend as string[])?.join(', ')}, about ${a.monthly} per month. My goal is ${a.goal}. What's the best credit card for me?`
      router.push(`/smart-match?q=${encodeURIComponent(query)}`)
    } else {
      setStep(s => s + 1)
    }
  }

  const progress = ((step + 1) / STEPS.length) * 100

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #FAF5EB 0%, #F0E8D8 100%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: '24px 16px'
    }}>
      <div style={{ width: '100%', maxWidth: 520 }}>

        {/* Progress */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
          <div style={{ flex: 1, height: 4, background: 'rgba(20,41,80,0.1)', borderRadius: 2 }}>
            <div style={{ width: `${progress}%`, height: '100%', background: '#C9972E', borderRadius: 2, transition: 'width 0.3s ease' }} />
          </div>
          <span style={{ fontSize: 12, color: '#5A6A8A', fontWeight: 600 }}>{step + 1}/{STEPS.length}</span>
        </div>

        {/* Question */}
        <h1 style={{ fontSize: 'clamp(22px, 4vw, 30px)', fontWeight: 800, color: '#142950', marginBottom: 8, lineHeight: 1.25 }}>
          {current.title}
        </h1>
        <p style={{ fontSize: 15, color: '#5A6A8A', marginBottom: 28, lineHeight: 1.5 }}>
          {current.subtitle}
        </p>

        {/* Options */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 32 }}>
          {current.options.map(opt => {
            const isSelected = selected.includes(opt.id)
            return (
              <button
                key={opt.id}
                onClick={() => toggle(opt.id)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '16px 20px', borderRadius: 14,
                  border: isSelected ? '2px solid #C9972E' : '2px solid rgba(20,41,80,0.1)',
                  background: isSelected ? 'rgba(201,151,46,0.1)' : '#fff',
                  cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s ease',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                }}
              >
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#142950', marginBottom: 2 }}>{opt.label}</div>
                  <div style={{ fontSize: 13, color: '#5A6A8A' }}>{opt.sub}</div>
                </div>
                <div style={{
                  width: 22, height: 22, borderRadius: current.type === 'single' ? 11 : 6,
                  border: isSelected ? '2px solid #C9972E' : '2px solid rgba(20,41,80,0.2)',
                  background: isSelected ? '#C9972E' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0
                }}>
                  {isSelected && <span style={{ color: '#fff', fontSize: 12, fontWeight: 900 }}>✓</span>}
                </div>
              </button>
            )
          })}
        </div>

        {/* CTA */}
        <button
          onClick={next}
          disabled={selected.length === 0}
          style={{
            width: '100%', padding: '16px 24px', borderRadius: 16,
            background: selected.length > 0 ? '#142950' : 'rgba(20,41,80,0.2)',
            color: '#fff', fontSize: 16, fontWeight: 800,
            border: 'none', cursor: selected.length > 0 ? 'pointer' : 'not-allowed',
            transition: 'all 0.15s ease'
          }}
        >
          {isLast ? '🔍 Find my perfect card' : 'Continue →'}
        </button>

        {step > 0 && (
          <button
            onClick={() => { setStep(s => s - 1); setSelected([]); }}
            style={{ marginTop: 12, width: '100%', padding: '12px', background: 'transparent', border: 'none', color: '#5A6A8A', fontSize: 14, cursor: 'pointer' }}
          >
            ← Back
          </button>
        )}

        <p style={{ textAlign: 'center', fontSize: 12, color: '#5A6A8A', marginTop: 20 }}>
          No sign-up required · No affiliate bias · Takes 60 seconds
        </p>
      </div>
    </div>
  )
}
