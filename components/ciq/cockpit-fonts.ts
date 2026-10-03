// Cockpit-only typography. Loaded here (dashboard module) — NOT the root layout —
// so Newsreader + Instrument Sans apply to the Cockpit and nothing else.
// Bundled upright fonts keep builds independent of Google Fonts availability.
import localFont from 'next/font/local'

export const cockpitDisplay = localFont({
  src: './fonts/Newsreader.ttf',
  weight: '400 500',
  style: 'normal',
  display: 'swap',
  variable: '--cq-font-display',
})

export const cockpitBody = localFont({
  src: './fonts/InstrumentSans.ttf',
  weight: '400 600',
  style: 'normal',
  display: 'swap',
  variable: '--cq-font-body',
})
