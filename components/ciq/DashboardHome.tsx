'use client'

// Home · 2a Wheel — the signed-in /dashboard.
//
// Chrome: NavShell carves /dashboard out of the shared AppRail, so this component
// owns its own chrome — a 76px left rail at >=1100px and a 60px header + fixed
// bottom nav below it. The nav ITEMS come from the shared IA (appNav.tsx), only
// the RAIL'S LOOK is the design's; the design's own 4-item set is not used (it
// dropped Travel and mislabelled /wallet vs /cards).
//
// Data: GET /api/cockpit/summary (loadDecisionPortfolio). No second card query and
// no second card-matching path — the route already resolves catalogue + partners.
//
// Responsive: authored as two fixed frames (375 / 1440) with NO @media in the
// source. Written here as a JS breakpoint (matchMedia) — the desktop and mobile
// wheels use different transform formulas, which CSS media queries cannot swap.
// SSR-safe: mobile-first default, corrected on mount. Desktop root is fluid width.
//
// Motion: wheel = transform only, focal flip = transform + opacity only. Width and
// height are never animated. prefers-reduced-motion drops the transitions.

import { FormEvent, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { authedFetch } from '@/lib/authed-fetch'
import { APP_NAV, appActive } from '@/components/ciq/appNav'
import { cockpitDisplay, cockpitBody } from './cockpit-fonts'
import './home-2a-wheel.css'

const DISPLAY = "var(--cq-font-display, 'Newsreader', Georgia, serif)"
const BODY = "var(--cq-font-body, 'Instrument Sans', system-ui, sans-serif)"

// Catalogue ids that ship real card art in /public/card-art. Cards outside this set
// render the plain (art-less) face, so a missing .webp never 404s on the wheel.
const ART = new Set([
  'amex-gold', 'amex-mrcc', 'amex-platinum-travel', 'axis-atlas', 'hdfc-diners-black',
  'hdfc-infinia', 'hdfc-marriott-bonvoy', 'hdfc-millennia', 'hdfc-regalia-gold',
  'hdfc-swiggy', 'icici-amazon-pay', 'sbi-cashback', 'sbi-elite', 'tata-neu-infinity-hdfc',
])

// Partner-kind label. Decorative only; an unmapped name renders '' (no fabricated
// value). The transfer partner NAMES themselves come from the API.
const KIND: Record<string, string> = {
  'KrisFlyer': 'Airline miles', 'Accor ALL': 'Hotel points', 'Club ITC': 'Hotel points',
  'Marriott Bonvoy': 'Hotel points', 'Air India Maharaja Club': 'Airline miles',
  'Flying Blue': 'Airline miles', 'Etihad Guest': 'Airline miles',
  'Qatar Privilege Club': 'Airline miles', 'IHG One Rewards': 'Hotel points',
  'Wyndham Rewards': 'Hotel points',
}

const artUrl = (id: string) => '/card-art/' + id + '.webp'
const f = (n: number | null | undefined) => Math.round(Number(n || 0)).toLocaleString('en-IN')
const shortName = (name: string | null | undefined) =>
  (name || '').replace(/^(HDFC|Axis|SBI|ICICI|Amex|American Express)\s+/i, '').split(' ').slice(0, 2).join(' ')

type Card = {
  id: string
  bank: string
  cardName: string
  last4: string | null
  points: number
  verified: boolean
  selfEntered: boolean
  source?: string
  partners: string[]
  catalogueId: string | null
  pointsCurrency?: string
}
type Summary = {
  total: number
  verified: number
  selfEntered: number
  verifiedPercent: number
  cardCount: number
  transferPathCount: number
}
type SummaryResponse = { cards: Card[]; summary: Summary; catalogueCount?: number }

// SSR-safe breakpoints. Both server and first client render see {desk:false,
// wide:false} (mobile-first), so hydration matches; the real values land on mount.
function useBreakpoints() {
  const [bp, setBp] = useState({ desk: false, wide: false })
  useEffect(() => {
    const mDesk = window.matchMedia('(min-width: 1100px)')
    const mWide = window.matchMedia('(min-width: 1280px)')
    const update = () => setBp({ desk: mDesk.matches, wide: mWide.matches })
    update()
    mDesk.addEventListener('change', update)
    mWide.addEventListener('change', update)
    return () => {
      mDesk.removeEventListener('change', update)
      mWide.removeEventListener('change', update)
    }
  }, [])
  return bp
}

// Short labels for the narrow rail / bottom bar. Keyed by the shared IA href, so
// destinations and active-state stay the appNav single source of truth.
const RAIL_SHORT: Record<string, string> = {
  '/dashboard': 'Home', '/wallet': 'Wallet', '/spend-optimizer': 'Spend',
  '/trip-planner': 'Travel', '/cards': 'Cards', '/cira': 'CIRA', '/profile': 'You',
}
const railLabel = (href: string, fallback: string) => RAIL_SHORT[href] ?? fallback

export function DashboardHome({
  cards: propCards,
  totalPoints: propTotal,
}: {
  displayName: string
  cards: any[]
  totalPoints: number
  primaryBank: string
}) {
  const router = useRouter()
  const pathname = usePathname()
  const { desk, wide } = useBreakpoints()

  const [data, setData] = useState<SummaryResponse | null>(null)
  const [widx, setWidx] = useState(0)
  const [flip, setFlip] = useState(false)
  const [ask, setAsk] = useState('')

  useEffect(() => {
    authedFetch('/api/cockpit/summary')
      .then(async r => {
        if (!r.ok) throw new Error('summary failed')
        return r.json()
      })
      .then((json: SummaryResponse) => setData(json))
      .catch(() => {
        // Network/API fallback: render immediately from the props WalletView already
        // has. Partners are unknown here, so the focal panel shows its honest empty
        // state rather than a guess.
        const total = Number(propTotal || 0)
        setData({
          cards: (propCards || []).map((c: any, i: number) => ({
            id: c.id || String(i),
            bank: c.bank || '',
            cardName: c.card_name || c.cardName || c.bank || 'Card',
            last4: c.card_last4 || c.last4 || null,
            points: Number(c.points_balance ?? c.points ?? 0),
            verified: c.source === 'statement' && !c.self_entered,
            selfEntered: c.source !== 'statement' || !!c.self_entered,
            source: c.source || 'manual',
            partners: [],
            catalogueId: c.catalogue?.id || null,
          })),
          summary: {
            total, verified: 0, selfEntered: total, verifiedPercent: 0,
            cardCount: propCards?.length || 0, transferPathCount: 0,
          },
        })
      })
  }, [propCards, propTotal])

  const summary: Summary = data?.summary ?? {
    total: Number(propTotal || 0), verified: 0, selfEntered: Number(propTotal || 0),
    verifiedPercent: 0, cardCount: propCards?.length || 0, transferPathCount: 0,
  }
  const cards: Card[] = data?.cards ?? []
  const catalogueCount = data?.catalogueCount

  // Slots = real cards + at least one ghost, padded to 8 so a sparse wallet still
  // reads as a wheel. Ghosts are the honest "add a card" empty state.
  const slots = useMemo(() => ([
    ...cards.map(c => ({ ...c, kind: 'card' as const })),
    ...Array.from({ length: Math.max(1, 8 - cards.length) }, (_, k) => ({
      id: 'ghost-' + k, kind: 'ghost' as const, partners: [] as string[],
    })),
  ]), [cards])

  const n = slots.length
  const wi = Math.min(widx, n - 1)

  const g = useRef({ sx: null as number | null, sy: null as number | null, dragged: false, lw: 0 })

  const go = (dir: number) => {
    const t = Math.max(0, Math.min(n - 1, wi + dir))
    if (t !== wi) { setWidx(t); setFlip(false) }
  }
  const end = (dist: number) => {
    if (g.current.sx == null) return
    if (Math.abs(dist) > 24) {
      g.current.dragged = true
      setTimeout(() => { g.current.dragged = false }, 60)
      go(Math.round(dist / 90) || Math.sign(dist))
    }
    g.current.sx = null
  }
  const dragStart = (e: React.PointerEvent) => { g.current.sx = e.clientX; g.current.sy = e.clientY }
  const dragEndV = (e: React.PointerEvent) => end((g.current.sy ?? 0) - e.clientY)
  const dragEndH = (e: React.PointerEvent) => end((g.current.sx ?? 0) - e.clientX)
  const onWheel = (e: React.WheelEvent) => {
    const t = Date.now()
    if (t - (g.current.lw || 0) < 380) return
    g.current.lw = t
    go(e.deltaY > 0 ? 1 : -1)
  }
  const pick = (i: number, focal: boolean, ghost: boolean) => {
    if (g.current.dragged) return
    if (focal) { if (!ghost) setFlip(x => !x) }
    else { setWidx(i); setFlip(false) }
  }

  const wheel = slots.map((sl: any, i) => {
    const off = i - wi, focal = off === 0, ghost = sl.kind === 'ghost'
    const self = !ghost && !sl.verified
    const art = !ghost && !!sl.catalogueId && ART.has(sl.catalogueId)
    const partners = (sl.partners || []).map((p: string) => ({ name: p, kind: KIND[p] || '' }))
    return {
      key: sl.id, i, focal, isCard: !ghost, isGhost: ghost,
      isSelf: self, isVerified: !ghost && !!sl.verified,
      hasArt: art, plain: !ghost && !art, artSrc: art ? artUrl(sl.catalogueId) : '',
      cardName: sl.cardName || '', short: ghost ? '' : shortName(sl.cardName),
      bal: ghost ? '' : f(sl.points),
      last4Label: ghost ? '' : (sl.last4 ? '•••• ' + sl.last4 : (sl.verified ? 'From statements' : 'Reward card')),
      partnersShown: partners.slice(0, 3), noPartners: !ghost && partners.length === 0,
      hasMore: partners.length > 3, moreLabel: partners.length > 3 ? 'View all ' + partners.length + ' partners' : '',
      aria: ghost ? 'Empty slot, add a card'
        : (sl.cardName + ', ' + f(sl.points) + ' points, ' + (sl.verified ? 'verified' : 'self-entered')),
      z: 20 - Math.abs(off),
      faceBg: ghost ? '#FFFFFF' : art ? '#1C2030' : self ? 'linear-gradient(135deg,#232838,#12151F 65%)' : '#F6F2EA',
      faceFg: self || art ? '#F6F2EA' : '#12151F',
      faceBorder: ghost ? '1.5px dashed #8A8C93' : self ? '1.5px dashed #C9A86A' : '2px solid #2E7D4F',
      shadow: ghost ? 'none' : focal ? '0 30px 60px rgba(18,21,31,.32)' : '0 14px 30px rgba(18,21,31,.18)',
      flipT: focal && flip ? 'rotateY(180deg)' : 'rotateY(0deg)',
      backO: focal && flip ? 1 : 0, frontO: focal && flip ? 0 : 1,
      dT: 'rotate(' + (off * 26) + 'deg) translateX(-500px) scale(' + (focal ? 1.08 : 0.94) + ')',
      mT: 'rotate(' + (off * 24) + 'deg) translateY(390px) scale(' + (focal ? 1.05 : 0.92) + ')',
    }
  })

  const cur = wheel[wi] ?? wheel[0]
  const ws = {
    ...cur,
    counter: cur?.isCard ? 'Card ' + (wi + 1) + ' of ' + cards.length : 'Empty slot',
    hint: cur?.isCard ? (flip ? 'Tap to flip back' : 'Tap card to flip') : 'Drag to turn',
  }

  // Derived, honest values.
  const total = summary.total || 0
  const paths = summary.transferPathCount || 0
  const hasPoints = total > 0
  // WORTH bounds: ₹0.25 (floor) and ₹1.80 (ceiling) per point. These two constants
  // live HERE and in WalletView.tsx; they have no sourced origin yet and ship under
  // the design's ESTIMATE label. Track for separate sourcing.
  const floorLabel = f(total * 0.25)
  const ceilLabel = f(total * 1.8)
  const verifiedW = (summary.verifiedPercent || 0) + '%'
  const verifiedLine = summary.verified > 0
    ? summary.verifiedPercent + '% verified · ' + f(summary.verified) + ' from statements'
    : (total > 0 ? 'Nothing verified yet · upload a statement' : 'No cards yet')
  const selfLine = summary.selfEntered > 0 ? 'Rest self-entered' : ''
  const rateLine = 'At ₹0.25–₹1.80 a point' + (paths ? ', across ' + paths + ' transfer paths' : '')
  const rateLineShort = '₹0.25–₹1.80 a point' + (paths ? ' · ' + paths + ' transfer paths' : '')
  const catalogueLabel = catalogueCount ? 'Catalogue · ' + catalogueCount + ' cards' : 'Catalogue'
  const totalLabel = f(total)

  const askCira = (e: FormEvent) => {
    e.preventDefault()
    const q = ask.trim()
    router.push(q ? '/cira?seed=' + encodeURIComponent(q) : '/cira')
  }

  const primaryNav = APP_NAV.filter(item => item.key !== 'you')
  const profileNav = APP_NAV.filter(item => item.key === 'you')

  // ---- rail item (desktop 76px rail) ----
  const railItem = (item: (typeof APP_NAV)[number]) => {
    const active = appActive(item.href, pathname)
    const Icon = item.Icon
    return (
      <Link
        key={item.href}
        href={item.href}
        aria-label={item.label}
        aria-current={active ? 'page' : undefined}
        style={{
          width: 56, minHeight: 52, borderRadius: 8,
          background: active ? '#262A36' : 'transparent',
          color: active ? '#F6F2EA' : '#B9BBC2',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          gap: 4, padding: '4px 2px', fontFamily: BODY, fontSize: 9,
          fontWeight: active ? 600 : 500, textAlign: 'center',
        }}
      >
        <Icon size={18} strokeWidth={1.8} aria-hidden />
        <span>{railLabel(item.href, item.label)}</span>
      </Link>
    )
  }

  // ---- bottom nav item (mobile) ----
  const barItem = (item: (typeof APP_NAV)[number]) => {
    const active = appActive(item.href, pathname)
    const Icon = item.Icon
    return (
      <Link
        key={item.href}
        href={item.href}
        aria-label={item.label}
        aria-current={active ? 'page' : undefined}
        style={{
          flex: 1, minWidth: 0, minHeight: 48, borderRadius: 8,
          color: active ? '#F6F2EA' : '#9A9CA3',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          gap: 3, padding: '2px', fontFamily: BODY, fontSize: 9,
          fontWeight: active ? 600 : 500, textAlign: 'center',
        }}
      >
        <Icon size={19} strokeWidth={1.8} aria-hidden />
        <span>{railLabel(item.href, item.label)}</span>
      </Link>
    )
  }

  // ---- one card face (shared by both layouts, sized per layout) ----
  const cardFace = (c: (typeof wheel)[number], size: 'desk' | 'mob') => {
    const D = size === 'desk'
    const radius = D ? 16 : 12
    return (
      <div
        className="h2a-card-inner"
        style={{
          position: 'relative', width: '100%', height: '100%', borderRadius: radius,
          transformStyle: 'preserve-3d', transform: c.flipT,
          transition: 'transform .7s cubic-bezier(.3,.7,.2,1)',
        }}
      >
        {/* front */}
        <div style={{
          position: 'absolute', inset: 0, backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden',
          opacity: c.frontO, transition: 'opacity 0s linear .3s', borderRadius: radius,
          background: c.faceBg, color: c.faceFg, border: c.faceBorder, boxShadow: c.shadow,
          padding: D ? 22 : 14, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', overflow: 'hidden',
        }}>
          {c.hasArt && (
            <>
              <img src={c.artSrc} alt={c.cardName} draggable={false} style={{
                position: 'absolute', inset: 0, width: '100%', height: '100%',
                objectFit: 'cover', borderRadius: radius - 1, pointerEvents: 'none',
              }} />
              <div style={{
                position: 'absolute', left: 0, right: 0, bottom: 0,
                padding: D ? '34px 18px 14px' : '24px 12px 10px',
                background: 'linear-gradient(180deg,rgba(18,21,31,0),rgba(18,21,31,.9) 55%)',
                color: '#F6F2EA', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', pointerEvents: 'none',
              }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {c.isSelf && <span style={badgeSelfArt(D)}><span style={dotOutline(D)} />SELF-ENTERED</span>}
                  {c.isVerified && <span style={badgeVerifiedArt(D)}><span style={dotSolid(D)} />VERIFIED</span>}
                  <span style={{ fontFamily: DISPLAY, fontWeight: 500, fontSize: D ? 32 : 22, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
                    {c.bal}{D && <span style={{ fontFamily: BODY, fontWeight: 600, fontSize: 11, letterSpacing: '.1em' }}> PTS</span>}
                  </span>
                </div>
                <span style={{ fontWeight: 500, fontSize: D ? 13 : 11, letterSpacing: D ? '.1em' : '.08em' }}>{c.last4Label}</span>
              </div>
            </>
          )}
          {c.plain && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: D ? 10 : 6 }}>
                <span style={{ fontFamily: DISPLAY, fontWeight: 500, fontSize: D ? 19 : 14, lineHeight: 1.2 }}>{D ? c.cardName : c.short}</span>
                {c.isVerified && <span style={{ ...badgeVerified(D), flex: 'none' }}><span style={dotSolid(D)} />VERIFIED</span>}
                {c.isSelf && <span style={{ ...badgeSelf(D), flex: 'none' }}><span style={dotOutline(D)} />SELF-ENTERED</span>}
              </div>
              {D ? (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <span style={{ fontWeight: 600, fontSize: 10, letterSpacing: '.12em', opacity: .8 }}>POINTS</span>
                    <span style={{ fontFamily: DISPLAY, fontWeight: 500, fontSize: 38, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{c.bal}</span>
                  </div>
                  <span style={{ fontWeight: 500, fontSize: 14, letterSpacing: '.1em' }}>{c.last4Label}</span>
                </div>
              ) : (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                  <span style={{ fontFamily: DISPLAY, fontWeight: 500, fontSize: 26, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{c.bal}</span>
                  <span style={{ fontWeight: 500, fontSize: 11, letterSpacing: '.08em' }}>{c.last4Label}</span>
                </div>
              )}
            </>
          )}
          {c.isGhost && (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: D ? 15 : 13, color: '#3A3D47' }}>
              + Add a card
            </div>
          )}
        </div>
        {/* back (cards only) */}
        {c.isCard && (
          <div style={{
            position: 'absolute', inset: 0, backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)', opacity: c.backO, transition: 'opacity 0s linear .3s', borderRadius: radius,
            background: '#FFFFFF', border: '1.5px solid #12151F',
            boxShadow: D ? '0 30px 60px rgba(18,21,31,.25)' : 'none',
            padding: D ? 20 : 12, display: 'flex', flexDirection: 'column', gap: 8,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 6 }}>
              <span style={{ fontWeight: 600, fontSize: 10, letterSpacing: '.12em', color: '#4A4D57' }}>CAN BECOME</span>
              <span style={estimateChip}>ESTIMATE</span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {c.partnersShown.map((p: { name: string }, k: number) => (
                <span key={p.name + k} style={{
                  display: 'inline-flex', alignItems: 'center', height: D ? 34 : 26, padding: D ? '0 10px' : '0 9px',
                  border: '1px solid #DADAD6', borderRadius: D ? 17 : 13, fontWeight: 600, fontSize: D ? 14 : 12,
                }}>{p.name}</span>
              ))}
            </div>
            {c.noPartners && <div style={{ fontSize: D ? 14 : 12, lineHeight: 1.4, color: '#3A3D47' }}>No partners mapped to this balance yet.</div>}
            <div style={{ marginTop: 'auto', fontWeight: 500, fontSize: 11, color: '#4A4D57' }}>Tap to flip back</div>
          </div>
        )}
      </div>
    )
  }

  // ---- desktop wheel card ----
  const deskCard = (c: (typeof wheel)[number]) => (
    <div
      key={c.key}
      className="h2a-card"
      role="button"
      aria-label={c.aria}
      onClick={() => pick(c.i, c.focal, c.isGhost)}
      style={{
        position: 'absolute', left: -180, top: -113, width: 360, height: 227, zIndex: c.z,
        transform: c.dT, transition: 'transform .9s cubic-bezier(.2,.75,.15,1)', cursor: 'pointer',
        perspective: 1200, borderRadius: 16, touchAction: 'none',
      }}
    >
      {cardFace(c, 'desk')}
    </div>
  )

  // ---- mobile wheel card ----
  const mobCard = (c: (typeof wheel)[number]) => (
    <div
      key={c.key}
      className="h2a-card"
      role="button"
      aria-label={c.aria}
      onClick={() => pick(c.i, c.focal, c.isGhost)}
      style={{
        position: 'absolute', left: -115, top: -72, width: 230, height: 145, zIndex: c.z,
        transform: c.mT, transition: 'transform .9s cubic-bezier(.2,.75,.15,1)', cursor: 'pointer',
        perspective: 1200, borderRadius: 12,
      }}
    >
      {cardFace(c, 'mob')}
    </div>
  )

  // ---- focal "IN FOCUS" panel body (shared) ----
  const focusPanel = (compact: boolean) => (
    ws.isCard ? (
      <>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
          <span style={{ fontFamily: DISPLAY, fontWeight: 500, fontSize: compact ? 18 : 22, lineHeight: 1.2, minWidth: 0 }}>{ws.cardName}</span>
          <span style={{ ...estimateChip, flex: 'none' }}>{compact ? 'ESTIMATE' : 'PARTNERS · ESTIMATE'}</span>
        </div>
        {ws.partnersShown.map((p: { name: string; kind: string }, k: number) => (
          <div key={p.name + k} style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8,
            minHeight: 48, borderTop: '1px solid #E8E8E5',
          }}>
            <span style={{ fontWeight: 600, fontSize: 15, lineHeight: 1.2 }}>{p.name}</span>
            <span style={{ fontSize: compact ? 12 : 13, color: '#4A4D57' }}>{p.kind}</span>
          </div>
        ))}
        {ws.hasMore && (
          <Link href="/transfer-partners" style={{ minHeight: 44, display: 'flex', alignItems: 'center', borderTop: '1px solid #E8E8E5', fontWeight: 600, fontSize: 14 }}>
            {ws.moreLabel} →
          </Link>
        )}
        {ws.noPartners && (
          <div style={{ border: '1px dashed #9A9CA3', borderRadius: 8, padding: 14, fontSize: 14, lineHeight: 1.45, color: '#3A3D47' }}>
            No partners are mapped to this balance yet. Once we identify the issuer, its transfer paths will show here.
          </div>
        )}
      </>
    ) : (
      <>
        <div style={{ fontFamily: DISPLAY, fontWeight: 500, fontSize: compact ? 18 : 22, lineHeight: 1.2 }}>Empty slot</div>
        <div style={{ fontSize: 14, lineHeight: 1.45, color: '#3A3D47' }}>Add a card by hand, or upload a statement so its balance is verified.</div>
        <Link href="/wallet" style={{
          minHeight: 48, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          borderRadius: 8, background: '#12151F', color: '#F6F2EA', fontWeight: 600, fontSize: 14, padding: '0 16px',
        }}>Add a card</Link>
      </>
    )
  )

  const rootClass = `h2a-root ${cockpitDisplay.variable} ${cockpitBody.variable}`

  // ================= DESKTOP =================
  if (desk) {
    return (
      <div className={rootClass}>
        <div style={{ width: '100%', minHeight: '100vh', background: '#FFFFFF', display: 'flex', overflow: 'hidden', position: 'relative' }}>
          <nav aria-label="CreditIQ" style={{
            width: 76, flex: 'none', background: '#12151F', display: 'flex', flexDirection: 'column',
            alignItems: 'center', padding: '24px 0', gap: 20, position: 'relative', zIndex: 30,
          }}>
            <Link href="/dashboard" aria-label="CreditIQ home" style={{
              width: 40, height: 40, borderRadius: '50%', border: '1.5px solid #C9A86A', color: '#C9A86A',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: DISPLAY, fontWeight: 600, fontSize: 15,
            }}>IQ</Link>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center', flex: 1 }}>
              {primaryNav.map(railItem)}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center' }}>
              {profileNav.map(railItem)}
            </div>
          </nav>

          <main style={{ flex: 1, minWidth: 0, position: 'relative', overflow: 'hidden' }}>
            {/* orbit guide */}
            <div style={{ position: 'absolute', left: 'calc(100% - 400px)', top: '50%', width: 1040, height: 1040, marginTop: -520, borderRadius: '50%', border: '1px dashed #DADAD6', pointerEvents: 'none' }} />
            {/* wheel hub */}
            <div
              onPointerDown={dragStart}
              onPointerUp={dragEndV}
              onWheel={onWheel}
              style={{ position: 'absolute', left: 'calc(100% + 120px)', top: '50%', width: 0, height: 0 }}
            >
              {wheel.map(deskCard)}
            </div>
            {/* prev / next */}
            <div style={{ position: 'absolute', right: 300, bottom: 40, display: 'flex', alignItems: 'center', gap: 12, zIndex: 25 }}>
              <button onClick={() => go(-1)} aria-label="Previous card" style={ctrlBtn(false, 48)}>‹</button>
              <span style={{ minWidth: 120, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
                <span style={{ fontWeight: 600, fontSize: 13 }}>{ws.counter}</span>
                <span style={{ fontSize: 11, color: '#4A4D57' }}>{ws.hint}</span>
              </span>
              <button onClick={() => go(1)} aria-label="Next card" style={ctrlBtn(true, 48)}>›</button>
            </div>

            {/* content column */}
            <div style={{
              position: 'relative', zIndex: 24, width: 'min(calc(100% - 600px), 880px)', minHeight: '100%',
              padding: '40px 0 40px 48px', display: 'flex', flexDirection: 'column', gap: 24,
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ fontWeight: 600, fontSize: 11, letterSpacing: '.14em', color: '#4A4D57' }}>HOME · ALL CARDS</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' }}>
                  <span style={{ fontFamily: DISPLAY, fontWeight: 500, fontSize: 88, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{totalLabel}</span>
                  <span style={{ fontWeight: 500, fontSize: 17, color: '#3A3D47' }}>reward points</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 520 }}>
                  <div style={{ display: 'flex', height: 10, borderRadius: 5, overflow: 'hidden', border: '1px solid #DADAD6' }}>
                    <div style={{ width: verifiedW, background: '#2E7D4F' }} />
                    <div className="h2a-hatch" style={{ flex: 1 }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, fontWeight: 500, fontSize: 13, lineHeight: 1.3 }}>
                    <span style={{ color: '#1F5E3A' }}>{verifiedLine}</span>
                    <span>{selfLine}</span>
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: wide ? 'minmax(0,1fr) minmax(0,1fr)' : 'minmax(0,1fr)', gap: 16, flex: 1, minHeight: 0 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{ background: '#12151F', color: '#F6F2EA', borderRadius: 12, padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontWeight: 600, fontSize: 11, letterSpacing: '.1em', color: '#C8C9CE' }}>WORTH, DEPENDING ON THE PATH</span>
                      <span style={estimateChipDark}>ESTIMATE</span>
                    </div>
                    {hasPoints ? (
                      <>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontVariantNumeric: 'tabular-nums' }}>
                          <span style={{ fontFamily: DISPLAY, fontWeight: 500, fontSize: 34, lineHeight: 1 }}>₹{floorLabel}</span>
                          <span style={{ fontFamily: DISPLAY, fontWeight: 400, fontSize: 16, lineHeight: 1, color: '#C9A86A' }}>to</span>
                          <span style={{ fontFamily: DISPLAY, fontWeight: 500, fontSize: 44, lineHeight: 1, color: '#C9A86A' }}>₹{ceilLabel}</span>
                        </div>
                        <div style={{ fontSize: 13, lineHeight: 1.4, color: '#C8C9CE' }}>{rateLine}</div>
                      </>
                    ) : (
                      <div style={{ fontSize: 14, lineHeight: 1.45, color: '#C8C9CE' }}>Add a card to see what your points could be worth.</div>
                    )}
                  </div>
                  <Link href="/cards" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', minHeight: 56, padding: '0 18px', border: '1px solid #DADAD6', borderRadius: 12 }}>
                    <span style={{ fontWeight: 600, fontSize: 14 }}>{catalogueLabel}</span>
                    <span style={{ fontWeight: 600, fontSize: 14 }}>Browse →</span>
                  </Link>
                </div>

                <div style={{ background: '#F7F7F5', border: '1px solid #E8E8E5', borderRadius: 12, padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontWeight: 600, fontSize: 11, letterSpacing: '.1em', color: '#4A4D57' }}>IN FOCUS</span>
                    {ws.isCard && <span style={estimateChip}>PARTNERS · ESTIMATE</span>}
                  </div>
                  {focusPanel(false)}
                </div>
              </div>

              <form onSubmit={askCira} style={{ display: 'flex', gap: 8, height: 52, background: '#F7F7F5', border: '1px solid #E8E8E5', borderRadius: 10, padding: '4px 4px 4px 16px', alignItems: 'center' }}>
                <span style={{ fontWeight: 700, fontSize: 12, letterSpacing: '.08em', color: '#8A6B3A' }}>CIRA</span>
                <input name="q" aria-label="Ask CIRA" value={ask} onChange={e => setAsk(e.target.value)} placeholder="Ask about the card in focus"
                  style={{ flex: 1, minWidth: 0, border: 0, background: 'transparent', fontFamily: BODY, fontSize: 15, outline: 'none' }} />
                <button type="submit" style={{ height: 44, padding: '0 20px', border: 0, borderRadius: 8, background: '#12151F', color: '#F6F2EA', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>Ask</button>
              </form>
            </div>
          </main>
        </div>
      </div>
    )
  }

  // ================= MOBILE =================
  const BAR_H = 'calc(64px + env(safe-area-inset-bottom))'
  return (
    <div className={rootClass}>
      <div style={{ width: '100%', minHeight: '100dvh', background: '#FFFFFF', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <header style={{ height: 60, flex: 'none', background: '#12151F', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', position: 'relative', zIndex: 30 }}>
          <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ width: 32, height: 32, borderRadius: '50%', border: '1.5px solid #C9A86A', color: '#C9A86A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: DISPLAY, fontWeight: 600, fontSize: 12 }}>IQ</span>
            <span style={{ color: '#F6F2EA', fontWeight: 600, fontSize: 15 }}>Home</span>
          </Link>
          <span style={{ color: '#F6F2EA', fontFamily: DISPLAY, fontWeight: 500, fontSize: 14, fontVariantNumeric: 'tabular-nums' }}>{totalLabel} pts</span>
        </header>

        {/* wheel */}
        <div
          onPointerDown={dragStart}
          onPointerUp={dragEndH}
          style={{ position: 'relative', height: 310, flex: 'none', overflow: 'hidden', touchAction: 'pan-y' }}
        >
          <div style={{ position: 'absolute', left: '50%', top: -190, width: 0, height: 0 }}>
            {wheel.map(mobCard)}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, padding: '0 16px 8px' }}>
          <button onClick={() => go(-1)} aria-label="Previous card" style={ctrlBtn(false, 44)}>‹</button>
          <span style={{ minWidth: 120, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
            <span style={{ fontWeight: 600, fontSize: 13 }}>{ws.counter}</span>
            <span style={{ fontSize: 11, color: '#4A4D57' }}>{ws.hint}</span>
          </span>
          <button onClick={() => go(1)} aria-label="Next card" style={ctrlBtn(true, 44)}>›</button>
        </div>

        <div style={{ padding: '12px 16px 20px', display: 'flex', flexDirection: 'column', gap: 12, width: '100%', maxWidth: 640, margin: '0 auto', paddingBottom: BAR_H }}>
          <div style={{ background: '#F7F7F5', border: '1px solid #E8E8E5', borderRadius: 12, padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {focusPanel(true)}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', height: 8, borderRadius: 4, overflow: 'hidden', border: '1px solid #DADAD6' }}>
              <div style={{ width: verifiedW, background: '#2E7D4F' }} />
              <div className="h2a-hatch" style={{ flex: 1 }} />
            </div>
            <div style={{ fontWeight: 500, fontSize: 12, lineHeight: 1.3, color: '#1F5E3A' }}>{verifiedLine}</div>
          </div>

          <div style={{ background: '#12151F', color: '#F6F2EA', borderRadius: 12, padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
              <span style={{ fontWeight: 600, fontSize: 11, letterSpacing: '.1em', color: '#C8C9CE' }}>ALL {totalLabel} POINTS</span>
              <span style={estimateChipDark}>ESTIMATE</span>
            </div>
            {hasPoints ? (
              <>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontFamily: DISPLAY, fontWeight: 500, fontSize: 28, lineHeight: 1 }}>₹{floorLabel}</span>
                  <span style={{ fontFamily: DISPLAY, fontWeight: 400, fontSize: 16, lineHeight: 1, color: '#C9A86A' }}>to</span>
                  <span style={{ fontFamily: DISPLAY, fontWeight: 500, fontSize: 28, lineHeight: 1, color: '#C9A86A' }}>₹{ceilLabel}</span>
                </div>
                <div style={{ fontSize: 12, lineHeight: 1.4, color: '#C8C9CE' }}>{rateLineShort}</div>
              </>
            ) : (
              <div style={{ fontSize: 13, lineHeight: 1.45, color: '#C8C9CE' }}>Add a card to see an estimate.</div>
            )}
          </div>

          <Link href="/cards" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', minHeight: 52, padding: '0 16px', border: '1px solid #DADAD6', borderRadius: 10 }}>
            <span style={{ fontWeight: 600, fontSize: 14 }}>{catalogueLabel}</span>
            <span style={{ fontWeight: 600, fontSize: 14 }}>→</span>
          </Link>

          <form onSubmit={askCira} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input name="q" aria-label="Ask CIRA" value={ask} onChange={e => setAsk(e.target.value)} placeholder="Ask CIRA a question"
              style={{ flex: 1, minWidth: 0, height: 44, border: '1px solid #E8E8E5', borderRadius: 22, padding: '0 16px', background: '#FFFFFF', fontFamily: BODY, fontSize: 15, outline: 'none' }} />
            <button type="submit" style={{ height: 44, padding: '0 18px', border: 0, borderRadius: 22, background: '#12151F', color: '#F6F2EA', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>Ask</button>
          </form>
        </div>

        {/* fixed bottom nav — the shared IA (appNav), kept so mobile Home is not a
            navigation dead-end. The design's mobile frame omitted it. */}
        <nav aria-label="CreditIQ" style={{
          position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 40,
          background: '#12151F', borderTop: '1px solid #262A36',
          display: 'flex', alignItems: 'stretch', gap: 2, padding: '6px 6px',
          paddingBottom: 'calc(6px + env(safe-area-inset-bottom))',
        }}>
          {APP_NAV.map(barItem)}
        </nav>
      </div>
    </div>
  )
}

// ---------- small shared style helpers ----------
function ctrlBtn(filled: boolean, size: number): React.CSSProperties {
  return {
    width: size, height: size, borderRadius: '50%',
    border: filled ? 0 : '1px solid #12151F',
    background: filled ? '#12151F' : '#F7F7F5', color: filled ? '#F6F2EA' : '#12151F',
    fontWeight: 500, fontSize: size >= 48 ? 20 : 18, lineHeight: 1, cursor: 'pointer',
  }
}
const estimateChip: React.CSSProperties = {
  height: 20, display: 'inline-flex', alignItems: 'center', padding: '0 7px',
  border: '1px solid #B08D57', background: '#F1E7D3', borderRadius: 3,
  fontWeight: 700, fontSize: 10, letterSpacing: '.1em', color: '#12151F',
}
const estimateChipDark: React.CSSProperties = {
  height: 20, display: 'inline-flex', alignItems: 'center', padding: '0 7px',
  border: '1px solid #C9A86A', borderRadius: 3, color: '#C9A86A',
  fontWeight: 700, fontSize: 10, letterSpacing: '.1em',
}
function badgeVerified(D: boolean): React.CSSProperties {
  return {
    display: 'inline-flex', alignItems: 'center', gap: D ? 6 : 5, height: D ? 22 : 20, padding: D ? '0 8px' : '0 7px',
    borderRadius: D ? 11 : 10, background: '#E1EEE5', color: '#1F5E3A', fontWeight: 700, fontSize: D ? 10 : 9, letterSpacing: '.08em',
  }
}
function badgeSelf(D: boolean): React.CSSProperties {
  return {
    display: 'inline-flex', alignItems: 'center', gap: D ? 6 : 5, height: D ? 22 : 20, padding: D ? '0 8px' : '0 7px',
    borderRadius: D ? 11 : 10, border: '1px dashed #C9A86A', color: '#C9A86A', fontWeight: 700, fontSize: D ? 10 : 9, letterSpacing: '.08em',
  }
}
function badgeVerifiedArt(D: boolean): React.CSSProperties {
  return { ...badgeVerified(D), alignSelf: 'flex-start' }
}
function badgeSelfArt(D: boolean): React.CSSProperties {
  return { ...badgeSelf(D), alignSelf: 'flex-start', background: 'rgba(18,21,31,.6)' }
}
function dotSolid(D: boolean): React.CSSProperties {
  return { width: D ? 7 : 6, height: D ? 7 : 6, borderRadius: '50%', background: '#2E7D4F' }
}
function dotOutline(D: boolean): React.CSSProperties {
  return { width: D ? 7 : 6, height: D ? 7 : 6, borderRadius: '50%', border: '1.5px solid #C9A86A' }
}
