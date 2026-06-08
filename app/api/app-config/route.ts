import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export const revalidate = 300 // 5 min cache

export async function GET() {
  try {
    // Fetch latest intelligence for home feed
    const { data: intel } = await supabase
      .from('intelligence_kb')
      .select('id, source, creator_handle, title, content, insight_type, trust_score, card_mentions')
      .eq('active', true)
      .order('scraped_at', { ascending: false })
      .limit(10)

    // Fetch top cards by IQ score
    const { data: topCards } = await supabase
      .from('cards')
      .select('id, slug, name, bank, tier, annual_fee_inr, iq_score, network, best_for, category')
      .eq('active', true)
      .order('iq_score', { ascending: false })
      .limit(20)

    // Fetch recent devaluations
    const { data: devals } = await supabase
      .from('devaluation_events')
      .select('id, card_name, bank, description, impact, date')
      .eq('status', 'confirmed')
      .order('date', { ascending: false })
      .limit(5)

    // App config â€” change any of this without an APK update
    const config = {
      version: '1.0.0',
      lastUpdated: new Date().toISOString(),

      // Home screen
      home: {
        heroTitle: 'Find your perfect card',
        heroSubtitle: 'Tell CIRA your spends â†’ unbiased recommendation',
        statsBar: [
          { value: `${topCards?.length ? '170+' : '100+'}`, label: 'Cards' },
          { value: '3', label: 'Sources' },
          { value: 'â‚¹0', label: 'Bias' },
        ],
        quickActions: [
          { id: 'match', icon: 'sparkles-outline', label: 'Find my card', route: '/cira', color: '#142950' },
          { id: 'compare', icon: 'git-compare-outline', label: 'Compare', route: '/cards', color: '#7C3AED' },
          { id: 'roast', icon: 'flame-outline', label: 'Roast my card', route: '/cira', color: '#C0392B' },
          { id: 'optimize', icon: 'trending-up-outline', label: 'Optimize', route: '/rewards', color: '#16A34A' },
        ],
      },

      // Live intelligence feed for home screen
      intelligenceFeed: (intel || []).slice(0, 5).map(item => ({
        id: item.id,
        type: item.insight_type,
        icon: getIcon(item.insight_type),
        text: item.title || item.content?.slice(0, 120),
        color: getColor(item.insight_type),
        handle: item.creator_handle,
        source: item.source,
      })),

      // Featured cards (top 10 by IQ)
      featuredCards: (topCards || []).slice(0, 10),

      // Devaluation alerts
      alerts: (devals || []).map(d => ({
        id: d.id,
        title: `${d.card_name} devalued`,
        description: d.description,
        impact: d.impact,
        bank: d.bank,
        date: d.date,
      })),

      // CIRA suggested questions â€” update anytime
      ciraPrompts: [
        'Best card for â‚¹50K monthly spend',
        'Is HDFC Infinia worth â‚¹12,500?',
        'Roast my Axis Magnus card',
        'Best lounge access card under â‚¹2000 fee',
        'Which card for Air India flights?',
        'Best cashback card for Swiggy and Amazon',
      ],

      // Onboarding flow â€” update questions without APK update
      onboarding: {
        steps: [
          {
            id: 'spend',
            title: 'What do you spend most on?',
            type: 'multi',
            options: [
              { id: 'shopping', label: 'ðŸ›ï¸ Online Shopping', sub: 'Amazon, Flipkart, Myntra' },
              { id: 'dining', label: 'ðŸ½ï¸ Dining & Food', sub: 'Swiggy, Zomato, restaurants' },
              { id: 'travel', label: 'âœˆï¸ Travel', sub: 'Flights, hotels, cabs' },
              { id: 'fuel', label: 'â›½ Fuel', sub: 'Petrol & diesel' },
              { id: 'groceries', label: 'ðŸ›’ Groceries', sub: 'BigBasket, supermarkets' },
              { id: 'utility', label: 'ðŸ’¡ Bills', sub: 'Electricity, mobile recharges' },
            ],
          },
          {
            id: 'monthly',
            title: 'Monthly credit card spend?',
            type: 'single',
            options: [
              { id: '10k', label: 'Under â‚¹10,000' },
              { id: '25k', label: 'â‚¹10K â€“ â‚¹25K' },
              { id: '50k', label: 'â‚¹25K â€“ â‚¹50K' },
              { id: '1L', label: 'â‚¹50K â€“ â‚¹1L' },
              { id: '1L+', label: 'Over â‚¹1L' },
            ],
          },
          {
            id: 'goal',
            title: "What's your primary goal?",
            type: 'single',
            options: [
              { id: 'cashback', label: 'ðŸ’° Maximum cashback' },
              { id: 'travel', label: 'ðŸŒ Free flights & hotels' },
              { id: 'lounge', label: 'ðŸ›‹ï¸ Airport lounge access' },
              { id: 'simple', label: 'âœ… Simple, no-fee card' },
            ],
          },
        ],
      },

      // Feature flags â€” turn on/off features without APK
      features: {
        showIntelligenceFeed: true,
        showDevaluationAlerts: true,
        showOnboarding: true,
        showRewards: true,
        showScan: true,
        enableCiraVoice: false, // future feature
        enableCardComparison: true,
      },

      // Play Store metadata
      appInfo: {
        version: '1.0.0',
        minAppVersion: '1.0.0', // force update if below this
        updateMessage: null,
        maintenanceMode: false,
      },
    }

    return NextResponse.json(config)
  } catch (err) {
    console.error('App config error:', err)
    return NextResponse.json({ error: 'Config unavailable' }, { status: 500 })
  }
}

function getIcon(type: string): string {
  const map: Record<string, string> = {
    transfer_hack: 'â‡„', devaluation: 'â†“', sweet_spot: 'â˜…',
    strategy: 'â—†', card_review: 'âœ“', general: 'â—', reward_tip: 'â–¶',
  }
  return map[type] || 'â—'
}

function getColor(type: string): string {
  const map: Record<string, string> = {
    transfer_hack: '#7c3aed', devaluation: '#b91c1c', sweet_spot: '#065f46',
    strategy: '#92400e', card_review: '#0369a1', general: '#374151',
  }
  return map[type] || '#374151'
}
