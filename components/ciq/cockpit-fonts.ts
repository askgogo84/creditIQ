// Cockpit-only typography. Loaded here (dashboard module) — NOT the root layout —
// so Newsreader + Instrument Sans apply to the Cockpit and nothing else.
// style:['normal'] pins to the upright axis only: no italic is ever fetched.
import { Newsreader, Instrument_Sans } from 'next/font/google'

export const cockpitDisplay = Newsreader({
  subsets: ['latin'],
  weight: ['400', '500'],
  style: ['normal'],
  display: 'swap',
  variable: '--cq-font-display',
})

export const cockpitBody = Instrument_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  style: ['normal'],
  display: 'swap',
  variable: '--cq-font-body',
})
