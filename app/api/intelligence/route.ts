import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const source   = searchParams.get('source')   // instagram | reddit | youtube
  const cardSlug = searchParams.get('card')
  const type     = searchParams.get('type')     // devaluation | sweet_spot | comparison | hack
  const limit    = parseInt(searchParams.get('limit') ?? '20')
  const q        = searchParams.get('q')        // semantic search query

  try {
    // Semantic search if query provided
    if (q) {
      const embedRes = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + process.env.OPENAI_API_KEY,
        },
        body: JSON.stringify({ model: 'text-embedding-3-small', input: q.slice(0, 500) }),
      })

      if (embedRes.ok) {
        const embedData = await embedRes.json()
        const embedding = embedData.data?.[0]?.embedding

        if (embedding) {
          const { data, error } = await supabase.rpc('match_intelligence', {
            query_embedding: embedding,
            match_threshold: 0.5,
            match_count: limit,
          })
          if (!error && data?.length) {
            return NextResponse.json({ data, source: 'semantic', count: data.length })
          }
        }
      }
    }

    // Fallback: filter query
    let query = supabase
      .from('intelligence_kb')
      .select('*')
      .eq('active', true)
      .order('scraped_at', { ascending: false })
      .limit(limit)

    if (source)   query = query.eq('source', source)
    if (type)     query = query.eq('insight_type', type)
    if (cardSlug) query = query.contains('card_mentions', [cardSlug])

    const { data, error } = await query
    if (error) throw error

    return NextResponse.json({ data: data ?? [], count: data?.length ?? 0 })
  } catch (err: any) {
    console.error('Intelligence API error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
