filepath = r'app/api/ticker/route.ts'

new_content = r"""import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const revalidate = 3600

export async function GET() {
  try {
    const sb = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    const { data } = await sb
      .from('intelligence_kb')
      .select('title, content, insight_type, card_mentions')
      .eq('active', true)
      .in('insight_type', ['devaluation', 'sweet_spot', 'transfer_hack'])
      .not('content', 'is', null)
      .order('scraped_at', { ascending: false })
      .limit(12)

    if (!data?.length) return NextResponse.json({ items: [] })

    const items = data
      .map((row: any) => {
        const prefix = row.insight_type === 'devaluation' ? 'DEVALUATION' :
                       row.insight_type === 'sweet_spot' ? 'SWEET SPOT' : 'HACK'
        const body = (row.title?.trim()) || (row.content?.slice(0, 90))
        if (!body) return null
        const cards = row.card_mentions?.slice(0, 2).join(', ')
        return cards ? `${prefix} - ${cards}: ${body}` : `${prefix} - ${body}`
      })
      .filter((x: string | null): x is string => x !== null)

    return NextResponse.json({ items })
  } catch {
    return NextResponse.json({ items: [] })
  }
}
"""

with open(filepath, 'w', encoding='utf-8', newline='\n') as f:
    f.write(new_content)
print("OK: ticker API rewritten cleanly")
