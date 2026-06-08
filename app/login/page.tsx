// app/login/page.tsx (or app/auth/page.tsx — wherever your login page lives)
// Replace your existing login page with this

import GoogleOneTap from '@/components/GoogleOneTap'
import { CreditCard, Shield, TrendingUp, Zap } from 'lucide-react'

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* Logo + Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#1B3A5C] mb-4 shadow-lg">
            <CreditCard className="text-[#C9972E] w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold text-[#1B3A5C] tracking-tight">CreditIQ</h1>
          <p className="text-slate-500 mt-1 text-sm">India's unbiased credit card intelligence</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-8">
          <h2 className="text-xl font-semibold text-slate-800 mb-1">Welcome back</h2>
          <p className="text-slate-500 text-sm mb-6">
            Sign in to access your card portfolio and AI recommendations
          </p>

          {/* ── THE ONE TAP BUTTON ── */}
          {/* This shows their Google photo + name + email pre-filled */}
          <GoogleOneTap />

          <div className="mt-6 pt-6 border-t border-slate-100">
            <p className="text-xs text-slate-400 text-center">
              By continuing, you agree to our{' '}
              <a href="/terms" className="underline hover:text-slate-600">Terms</a>
              {' '}and{' '}
              <a href="/privacy" className="underline hover:text-slate-600">Privacy Policy</a>
            </p>
          </div>
        </div>

        {/* Why sign in — trust builders */}
        <div className="mt-6 grid grid-cols-3 gap-3">
          {[
            { icon: Shield, text: 'No password needed' },
            { icon: TrendingUp, text: 'Free forever' },
            { icon: Zap, text: 'Instant access' },
          ].map(({ icon: Icon, text }) => (
            <div key={text} className="bg-white rounded-xl p-3 text-center border border-slate-100 shadow-sm">
              <Icon className="w-4 h-4 text-[#1B3A5C] mx-auto mb-1" />
              <p className="text-xs text-slate-500">{text}</p>
            </div>
          ))}
        </div>

      </div>
    </div>
  )
}
