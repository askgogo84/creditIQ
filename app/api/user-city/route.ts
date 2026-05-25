import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

// Major Indian cities with IATA codes for flight search
const CITY_IATA: Record<string, string> = {
  'bangalore': 'BLR', 'bengaluru': 'BLR', 'blr': 'BLR',
  'mumbai': 'BOM', 'bombay': 'BOM', 'bom': 'BOM',
  'delhi': 'DEL', 'new delhi': 'DEL', 'del': 'DEL',
  'hyderabad': 'HYD', 'hyd': 'HYD',
  'chennai': 'MAA', 'madras': 'MAA', 'maa': 'MAA',
  'kolkata': 'CCU', 'calcutta': 'CCU', 'ccu': 'CCU',
  'pune': 'PNQ', 'pnq': 'PNQ',
  'ahmedabad': 'AMD', 'amd': 'AMD',
  'kochi': 'COK', 'cochin': 'COK', 'cok': 'COK',
  'jaipur': 'JAI', 'jai': 'JAI',
  'goa': 'GOI', 'panaji': 'GOI', 'goi': 'GOI',
  'lucknow': 'LKO', 'lko': 'LKO',
  'chandigarh': 'IXC', 'ixc': 'IXC',
  'coimbatore': 'CJB', 'cjb': 'CJB',
  'indore': 'IDR', 'idr': 'IDR',
  'bhopal': 'BHO', 'bho': 'BHO',
  'surat': 'STV', 'stv': 'STV',
  'nagpur': 'NAG', 'nag': 'NAG',
  'visakhapatnam': 'VTZ', 'vizag': 'VTZ', 'vtz': 'VTZ',
  'trivandrum': 'TRV', 'thiruvananthapuram': 'TRV', 'trv': 'TRV',
  'mangalore': 'IXE', 'ixe': 'IXE',
}

function extractCityFromAddress(address: string): string | null {
  if (!address) return null
  const lower = address.toLowerCase()
  for (const [city, iata] of Object.entries(CITY_IATA)) {
    if (lower.includes(city)) return city.charAt(0).toUpperCase() + city.slice(1)
  }
  return null
}

export async function GET(req: NextRequest) {
  try {
    const userId = new URL(req.url).searchParams.get('userId')
    if (!userId) return NextResponse.json({ city: null })

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // 1. Check user_profiles for saved home city
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('home_city, home_city_iata')
      .eq('user_id', userId)
      .single()

    if (profile?.home_city) {
      return NextResponse.json({
        city: profile.home_city,
        iata: profile.home_city_iata || 'BLR',
        source: 'profile'
      })
    }

    // 2. Try to extract from statement_imports billing address
    const { data: statements } = await supabase
      .from('statement_imports')
      .select('metadata')
      .eq('user_id', userId)
      .limit(5)

    if (statements?.length) {
      for (const stmt of statements) {
        const addr = stmt.metadata?.billing_address || stmt.metadata?.address || ''
        const city = extractCityFromAddress(addr)
        if (city) {
          const iata = CITY_IATA[city.toLowerCase()] || 'BLR'
          return NextResponse.json({ city, iata, source: 'statement' })
        }
      }
    }

    // 3. No city found - ask user
    return NextResponse.json({ city: null, source: 'unknown' })

  } catch (err) {
    return NextResponse.json({ city: null, source: 'error' })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId, city } = await req.json()
    if (!userId || !city) return NextResponse.json({ ok: false })

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const iata = CITY_IATA[city.toLowerCase()] || 'BLR'

    await supabase.from('user_profiles').upsert({
      user_id: userId,
      home_city: city,
      home_city_iata: iata,
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id' })

    return NextResponse.json({ ok: true, city, iata })
  } catch (err) {
    return NextResponse.json({ ok: false })
  }
}
