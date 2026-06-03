import os

filepath = r'app/blog/[slug]/page.tsx'
with open(filepath, 'r', encoding='utf-8-sig') as f:
    content = f.read()

# Replace the entire file with a DB-backed version
new_content = r"""import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Header } from '@/components/Header'
import { DesignFooter } from '@/components/design/Footer'
import { createClient } from '@supabase/supabase-js'
import type { Metadata } from 'next'

export const revalidate = 3600

async function getArticle(slug: string) {
  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  const { data } = await sb
    .from('blog_posts')
    .select('*')
    .eq('slug', slug)
    .eq('published', true)
    .single()
  return data
}

export async function generateStaticParams() {
  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  const { data } = await sb.from('blog_posts').select('slug').eq('published', true)
  return (data || []).map(r => ({ slug: r.slug }))
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const article = await getArticle(params.slug)
  if (!article) return { title: 'Not Found | CreditIQ' }
  return {
    title: article.title + ' | CreditIQ',
    description: article.intro?.substring(0, 160),
    openGraph: { title: article.title, description: article.intro?.substring(0, 160) },
    alternates: { canonical: 'https://creditiq.app/blog/' + params.slug },
  }
}

export default async function BlogArticlePage({ params }: { params: { slug: string } }) {
  const article = await getArticle(params.slug)
  if (!article) notFound()

  const sections: { heading: string; body: string }[] = Array.isArray(article.sections)
    ? article.sections
    : (typeof article.sections === 'string' ? JSON.parse(article.sections) : [])

  return (
    <>
      <Header />
      <div className="page-fade">

        {/* Hero */}
        <section style={{ position: 'relative', paddingTop: 'clamp(120px,18vw,150px)', paddingBottom: 48 }}>
          <div className="aurora" style={{ top: -80, right: -100, width: 600, height: 500, background: 'radial-gradient(circle,rgba(212,163,115,0.22),transparent 60%)' }} />
          <div style={{ maxWidth: 740, margin: '0 auto', padding: '0 clamp(16px,4vw,24px)', position: 'relative', zIndex: 2 }}>

            <Link href="/blog" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: 'var(--font-mono,monospace)', fontSize: 11, color: 'var(--ink-3,#5A6A8A)', textDecoration: 'none', letterSpacing: '0.05em', marginBottom: 32, fontWeight: 600 }}>
              &larr; All articles
            </Link>

            <div style={{ display: 'flex', gap: 14, alignItems: 'center', marginBottom: 20, flexWrap: 'wrap' }}>
              <span style={{ padding: '4px 14px', borderRadius: 999, background: `${article.tag_color}18`, border: `1px solid ${article.tag_color}35`, fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: article.tag_color, fontFamily: 'var(--font-mono,monospace)' }}>
                {article.tag}
              </span>
              <span style={{ fontFamily: 'var(--font-mono,monospace)', fontSize: 11, color: 'var(--ink-3,#5A6A8A)' }}>
                {article.date} &bull; {article.read_time}
              </span>
            </div>

            <h1 style={{ fontSize: 'clamp(24px,4vw,40px)', fontWeight: 800, color: 'var(--ink,#142950)', margin: '0 0 24px', lineHeight: 1.2, letterSpacing: '-0.03em' }}>
              {article.title}
            </h1>

            <div style={{ borderLeft: '3px solid var(--copper-3,#D89B2A)', paddingLeft: 20 }}>
              <p style={{ fontSize: 16, color: 'var(--ink-2,#2A3F6B)', lineHeight: 1.8, margin: 0, fontFamily: 'var(--font-serif,Georgia,serif)', fontStyle: 'italic' }}>
                {article.intro}
              </p>
            </div>
          </div>
        </section>

        {/* Body */}
        <section style={{ paddingBottom: 80 }}>
          <div style={{ maxWidth: 740, margin: '0 auto', padding: '0 clamp(16px,4vw,24px)' }}>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              {sections.map((section, idx) => (
                <div key={idx} style={{ background: 'var(--paper,#FAF5EB)', borderRadius: 20, padding: 'clamp(20px,3vw,32px)', border: '1px solid var(--line,rgba(20,41,80,0.08))' }}>
                  <h2 style={{ fontSize: 'clamp(17px,2vw,21px)', fontWeight: 700, color: 'var(--ink,#142950)', margin: '0 0 14px', letterSpacing: '-0.02em', lineHeight: 1.3 }}>
                    {section.heading}
                  </h2>
                  <div>
                    {section.body.split('\n\n').map((para, i) => (
                      <p key={i} style={{ fontSize: 14.5, color: 'var(--ink-2,#2A3F6B)', lineHeight: 1.85, margin: i > 0 ? '14px 0 0' : 0 }}>
                        {para.split('\n').map((line, j, arr) => (
                          <span key={j}>{line}{j < arr.length - 1 && <br />}</span>
                        ))}
                      </p>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Verdict */}
            {article.verdict && (
              <div style={{ marginTop: 24, background: 'var(--ink,#142950)', borderRadius: 20, padding: 'clamp(20px,3vw,32px)', position: 'relative', overflow: 'hidden' }}>
                <div className="aurora" style={{ top: -40, right: -40, width: 250, height: 250, background: 'radial-gradient(circle,rgba(212,163,115,0.18),transparent 60%)' }} />
                <div style={{ position: 'relative', zIndex: 2 }}>
                  <div style={{ fontFamily: 'var(--font-mono,monospace)', fontSize: 9, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--copper-3,#D89B2A)', marginBottom: 12 }}>CreditIQ Verdict</div>
                  <p style={{ margin: 0, fontSize: 15, color: 'rgba(255,255,255,0.75)', lineHeight: 1.8 }}>{article.verdict}</p>
                </div>
              </div>
            )}

            {/* CTAs */}
            <div style={{ marginTop: 32, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {article.related_card_slug && (
                <Link href={`/cards/${article.related_card_slug}`} style={{ display: 'inline-block', background: 'var(--copper-3,#D89B2A)', color: '#fff', padding: '12px 24px', borderRadius: 10, fontWeight: 700, fontSize: 14, textDecoration: 'none' }}>
                  View {article.related_card} &rarr;
                </Link>
              )}
              <Link href="/sweet-spots" style={{ display: 'inline-block', background: 'transparent', border: '1.5px solid var(--ink,#142950)', color: 'var(--ink,#142950)', padding: '12px 24px', borderRadius: 10, fontWeight: 700, fontSize: 14, textDecoration: 'none' }}>
                Redemption Sweet Spots
              </Link>
            </div>

            {/* More */}
            <div style={{ marginTop: 48 }}>
              <div style={{ fontFamily: 'var(--font-mono,monospace)', fontSize: 9, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--ink-3,#5A6A8A)', marginBottom: 14 }}>More articles</div>
              <Link href="/blog" style={{ display: 'block', background: 'var(--paper,#FAF5EB)', borderRadius: 16, padding: 20, border: '1px solid var(--line,rgba(20,41,80,0.08))', textDecoration: 'none' }}>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--ink,#142950)' }}>View all articles &rarr;</p>
                <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--ink-3,#5A6A8A)' }}>Card reviews, comparisons, and earning strategies</p>
              </Link>
            </div>

          </div>
        </section>

        <DesignFooter />
      </div>
    </>
  )
}
"""

with open(filepath, 'w', encoding='utf-8', newline='\n') as f:
    f.write(new_content)
print("OK: blog page now DB-backed")
