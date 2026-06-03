import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
export const runtime = 'nodejs'
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const slug = searchParams.get('slug')
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  if (slug) {
    const { data } = await sb.from('blog_posts').select('*').eq('slug', slug).eq('published', true).single()
    if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(data)
  }
  const { data } = await sb.from('blog_posts').select('slug,title,tag,tag_color,date,read_time,intro,related_card,related_card_slug').eq('published', true).order('published_at', { ascending: false }).limit(20)
  return NextResponse.json(data || [])
}
