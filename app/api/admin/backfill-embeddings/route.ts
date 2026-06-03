import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'
export const maxDuration = 300

async function getEmbedding(text: string): Promise<number[] | null> {
  try {
    const res = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + process.env.OPENAI_API_KEY,
      },
      body: JSON.stringify({ model: 'text-embedding-3-small', input: text.slice(0, 8000) }),
    })
    if (!res.ok) return null
    const data = await res.json()
    return data.data?.[0]?.embedding || null
  } catch { return null }
}

function buildEmbeddingText(row: any): string {
  const parts = [
    row.insight_type ? 'Type: ' + row.insight_type : '',
    row.title ? 'Title: ' + row.title : '',
    row.content ? 'Content: ' + row.content.slice(0, 1000) : '',
    row.card_mentions?.length ? 'Cards: ' + row.card_mentions.join(', ') : '',
    row.creator_handle ? 'Creator: ' + row.creator_handle : '',
    row.source ? 'Source: ' + row.source : '',
  ]
  return parts.filter(Boolean).join('\n')
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  if (body.password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Fetch all rows missing embeddings
  const { data: rows, error } = await sb
    .from('intelligence_kb')
    .select('id, insight_type, title, content, card_mentions, creator_handle, source')
    .is('embedding', null)
    .eq('active', true)
    .limit(100)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!rows?.length) return NextResponse.json({ message: 'All embeddings already populated', count: 0 })

  let success = 0
  let failed = 0
  const errors: string[] = []

  for (const row of rows) {
    const text = buildEmbeddingText(row)
    if (!text.trim()) { failed++; continue }

    const embedding = await getEmbedding(text)
    if (!embedding) { failed++; errors.push(row.id); continue }

    const { error: upErr } = await sb
      .from('intelligence_kb')
      .update({ embedding })
      .eq('id', row.id)

    if (upErr) { failed++; errors.push(row.id) }
    else success++

    // Small delay to avoid OpenAI rate limits
    await new Promise(r => setTimeout(r, 100))
  }

  return NextResponse.json({
    message: `Backfill complete: ${success} embedded, ${failed} failed`,
    success,
    failed,
    total: rows.length,
    errors: errors.slice(0, 5),
  })
}
