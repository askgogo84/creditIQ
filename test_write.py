import os

content = r"""'use client'

import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Header } from '@/components/Header'
import { DesignFooter } from '@/components/design/Footer'
import { CardTile, type TileCard } from '@/components/design/CardTile'
import { Reveal } from '@/components/design/Reveal'
import { SEED_CARDS } from '@/lib/data/seed-cards'
import type { CreditCard } from '@/lib/types'
import { type CardVariant } from '@/components/design/CreditCard3D'

const CATEGORIES: Record<string, { label: string; desc: string; emoji: string; filter: (c: CreditCard) => boolean }> = {
  travel: { label: 'Best Travel Cards', desc: 'Ranked by effective reward rate on travel spend, lounge access, and forex markup.', emoji: '\u2708', filter: c => (c.category || []).includes('travel') },
  cashback: { label: 'Best Cashback Cards', desc: 'Ranked by effective cashback rate across all spend categories.', emoji: '\U0001f4b0', filter: c => (c.category || []).includes('cashback') },
  shopping: { label: 'Best Shopping Cards', desc: 'Ranked by online and offline shopping reward rates.', emoji: '\U0001f6cd', filter: c => (c.category || []).includes('shopping') },
  dining: { label: 'Best Dining Cards', desc: 'Ranked by dining and food delivery reward rates.', emoji: '\U0001f37d', filter: c => (c.category || []).includes('dining') },
  fuel: { label: 'Best Fuel Cards', desc: 'Ranked by fuel surcharge waiver and fuel spend rewards.', emoji: '\u26fd', filter: c => c.fuel_surcharge_waiver === True },
  forex: { label: 'Best Forex Cards', desc: 'Zero or near-zero forex markup for international spends.', emoji: '\U0001f30d', filter: c => (c.forex_markup_percent or 99) <= 1.5 },
  lounge: { label: 'Best Lounge Access Cards', desc: 'Ranked by lounge access benefits.', emoji: '\U0001f6cb', filter: c => len(c.lounges or []) > 0 },
  lifetime_free: { label: 'Best Lifetime Free Cards', desc: 'Zero annual fee cards with the best rewards.', emoji: '\U0001f381', filter: c => c.annual_fee_inr === 0 },
}
"""

print("Writing file...")
