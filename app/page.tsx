'use client';

import type { CSSProperties } from 'react';
import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { SpendProvider } from '@/components/marketing/landing/SpendContext';
import { HeroCompute } from '@/components/marketing/landing/HeroCompute';
import { HeroProof } from '@/components/marketing/landing/HeroProof';
import { FaresBoard } from '@/components/marketing/landing/FaresBoard';
import { SEED_CARDS } from '@/lib/data/seed-cards';
import { getRedemptionOptions } from '@/lib/redemption';
import { HomeHeroBg } from './HomeHeroBg';
import { HomePointsMedia } from './HomePointsMedia';
import { AskCiraEntry } from './AskCiraEntry';
import { SmartCardMatch } from './SmartCardMatch';
import { HomeCardRanks } from './HomeCardRanks';
import styles from './page.module.css';

// Map the readable hm-* names to their hashed CSS-module classes. Compound
// classNames (e.g. hm-btn hm-sm hm-solid) pass every name. Element/pseudo
// selectors (.hm-tickrow b, .hm-window::before) live in the module and need no
// className here.
const cx = (...names: string[]) => names.map((n) => styles[n]).join(' ');

// ─────────────────────────────────────────────────────────────────────────────
// CreditIQ merged homepage — Phase A (shell + hero + live fares).
// Reference: docs/design/home-merge-v4.html. Tokens: DESIGN.md § Merged homepage.
//   · Fixed white/copper + teal palette (literal hexes), NOT the app light/dark
//     toggle — same convention as the /landing surface.
//   · HeroCompute / HeroProof / FaresBoard are IMPORTED from their shared home in
//     components/marketing/landing (the same maths that powers /landing) and
//     re-skinned to the light tokens by setting --hc-* / --hp-* / --fb-* CSS vars
//     on the wrappers below. No second copy of that maths exists.
//   · Header is position:fixed (NOT sticky): html/body set overflow-x:hidden in
//     globals.css, which detaches sticky bars — see SiteNav's note and the
//     "sticky broken by overflow-x:hidden" project memory.
// Phase A intentionally STOPS after #fares. Method, Smart Match, tools, editorial
// and the (still-unsourced) Receipts / Reviews bands are later phases.
// ─────────────────────────────────────────────────────────────────────────────

// DARK-HERO skin var maps. The hero section is now full-bleed dark (the clip is its
// background) while the rest of the page stays white/cream/teal — so the copy column
// takes LIGHT inks here. Each key overrides a var(--x, <landing-fallback>) inside the
// shared component, so /landing (which sets none of these) is untouched.
//   · Copper accent is LIGHTENED for the dark clip (the page copper #9A6516 fails
//     contrast on footage). One named place: the --copper-on-dark token is defined on
//     .hm-hero in page.module.css; these inline vars reference it so the value is never
//     re-typed here. "booked" stays ROMAN (accent-style normal), in copper.
//   · Estimated pill stays neutral grey (provenance law) — the light-grey dark variant.
//   · Slider track fill goes copper (teal #0E3B3C would vanish on the dark ground).
const HERO_COMPUTE_VARS: CSSProperties = {
  '--hc-headline': '#F4F1EC',
  '--hc-accent': 'var(--copper-on-dark)',
  '--hc-accent-style': 'normal', // "booked" roman, not italic (Emphasis rule)
  '--hc-pill-bg': 'rgba(255,255,255,0.08)',
  '--hc-pill-bd': 'rgba(255,255,255,0.22)',
  '--hc-pill-fg': 'rgba(244,241,236,0.74)', // Estimated stays neutral grey (provenance law)
  '--hc-sub': 'rgba(244,241,236,0.74)',
  '--hc-range': '#F7F4EF',
  '--hc-panel-bg': 'rgba(255,255,255,0.05)',
  '--hc-panel-bd': 'rgba(255,255,255,0.16)',
  '--hc-label': 'rgba(244,241,236,0.66)',
  '--hc-value': '#F7F4EF',
  '--hc-scale': 'rgba(244,241,236,0.62)', // slider end labels — kept legible over the clip
  '--hc-track-fill': 'var(--copper-on-dark)',
  '--hc-track-rem': 'rgba(255,255,255,0.18)',
  '--hc-thumb': '#EFD9A6',
  '--hc-thumb-bd': '#0B0E13',
} as CSSProperties;

// The Live Proof card stays a LIGHT card floating over the clip (as on /landing) — so
// its inks stay dark. A deeper shadow lifts it off the dark footage.
const HERO_PROOF_VARS: CSSProperties = {
  '--hp-card-bg': '#FFFFFF',
  '--hp-hair': '#E2DCD0',
  '--hp-shadow': '0 20px 54px rgba(0,0,0,0.38)',
  '--hp-muted': '#6E7B82',
  '--hp-body': '#48565E',
  '--hp-ink': '#10202A',
  '--hp-verified': '#1A7A5E',
} as CSSProperties;

const FARES_VARS: CSSProperties = {
  '--fb-tab-on': '#0E3B3C',
  '--fb-tab-on-fg': '#F4F0E6',
  '--fb-tab-bd': '#D3CBBB',
  '--fb-body': '#48565E',
  '--fb-hair': '#E2DCD0',
  '--fb-ink': '#10202A',
  '--fb-muted': '#6E7B82',
} as CSSProperties;

// ── §03 Where points go — the ₹2,70,000 vs ₹75,000 split, COMPUTED from one real
// card's redemption_options (the same derivation /landing uses; the value is derived
// from canonical SEED_CARDS, never a hardcoded rupee). The gap is real: one balance
// priced two ways, each with its provenance. If the card or a path is missing the
// figure is dropped (?? fallbacks in the JSX), never faked.
const REDEEM_CARD = SEED_CARDS.find((c) => c.id === 'hdfc-infinia');
const REDEEM_BALANCE = 150000;
const inr = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`;

function computeRedeemSplit() {
  if (!REDEEM_CARD) return null;
  const opts = getRedemptionOptions(REDEEM_CARD);
  const premium = opts
    .filter((o) => o.type === 'transfer')
    .sort((a, b) => b.value_per_point_inr - a.value_per_point_inr)[0];
  const floor = opts.find((o) => o.type === 'voucher') ?? opts.find((o) => o.type === 'product');
  if (!premium || !floor) return null;
  return {
    card: REDEEM_CARD.name,
    balance: REDEEM_BALANCE.toLocaleString('en-IN'),
    hi: inr(REDEEM_BALANCE * premium.value_per_point_inr),   // e.g. ₹2,70,000 (best transfer)
    floor: inr(REDEEM_BALANCE * floor.value_per_point_inr),  // e.g. ₹75,000 (catalogue)
  };
}
const REDEEM = computeRedeemSplit();

// Where a signed-in visitor to the crawlable marketing "/" is sent. Client-side
// only (a server redirect would kill "/" static rendering / SEO).
// INTERIM: repoint to '/home' in one line once the Home surface ships (docs/00-SIGNED-IN-IA.md §2).
const SIGNED_IN_HOME = '/dashboard';

export default function HomePage() {
  const router = useRouter();
  // Client-only veil: false on the server + first client render, so the static
  // marketing HTML is what crawlers get and hydration matches. Flips true only
  // while a confirmed session is being redirected away, to hide the flash.
  const [redirecting, setRedirecting] = useState(false);
  const firedRef = useRef(false);

  useEffect(() => {
    const sb = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
    let settled = false;
    // Fallback: if auth never resolves within 2s, reveal marketing regardless.
    const timer = setTimeout(() => { if (!settled) { settled = true; setRedirecting(false); } }, 2000);

    // Decide ONLY on the resolved getSession() truth. Every sign-out handler awaits
    // sb.auth.signOut() before landing on "/", so by the time this runs the session
    // is already cleared -> null -> no redirect. That is what stops the sign-out
    // bounce loop (sign out -> "/" -> yanked back into the app).
    sb.auth.getSession().then(({ data: { session } }) => {
      if (settled) return;
      settled = true; clearTimeout(timer);
      if (session?.user && !firedRef.current) {
        firedRef.current = true;
        setRedirecting(true);
        router.replace(SIGNED_IN_HOME);
      }
    });

    // Belt-and-suspenders for a same-tab sign-out that races the check: cancel any
    // pending redirect and reveal marketing. (INITIAL_SESSION on subscribe is
    // ignored; only SIGNED_OUT matters here.)
    const { data: { subscription } } = sb.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') { firedRef.current = true; settled = true; clearTimeout(timer); setRedirecting(false); }
    });

    return () => { clearTimeout(timer); subscription.unsubscribe(); };
  }, [router]);

  return (
    <>
      {redirecting && (
        <div aria-hidden="true" style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'var(--bg,#fff)' }} />
      )}

      {/* Type A fonts — Fraunces (display, roman only) · Inter (body) · JetBrains Mono (figures) */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link
        href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,300;9..144,400&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap"
        rel="stylesheet"
      />
      <header className={cx('hm-header')}>
        <div className={cx('hm-wrap', 'hm-nav')}>
          <Link href="#top" className={cx('hm-logo')}>
            <span className={cx('hm-mark')}>C</span>CreditIQ
          </Link>
          <nav className={cx('hm-navlinks')}>
            <Link href="#fares">Fares</Link>
            <Link href="/cards">Cards</Link>
            <Link href="/plans">Pricing</Link>
          </nav>
          <div className={cx('hm-navcta')}>
            <Link className={cx('hm-btn', 'hm-sm')} href="/login">Sign in</Link>
            <Link className={cx('hm-btn', 'hm-sm', 'hm-solid')} href="/login">Find my card</Link>
          </div>
        </div>
      </header>

      <main id="top" style={{ background: '#FFFFFF', color: '#10202A', fontFamily: "'Inter', system-ui, sans-serif", paddingTop: 64 }}>
        {/* Ticker — clean copy; no internal fields leaked. Duplicated once for a seamless loop. */}
        <div className={cx('hm-ticker')}>
          <div className={cx('hm-tickrow')}>
            <span><b>Sweet spot</b> — Delhi to Zurich business class for 40,000 Aeroplan points</span>
            <span><b>Change</b> — Axis Magnus Burgundy revisions effective 28 August 2026</span>
            <span><b>Watch</b> — HDFC BizPower adds airline and hotel transfer partners</span>
            <span aria-hidden="true"><b>Sweet spot</b> — Delhi to Zurich business class for 40,000 Aeroplan points</span>
            <span aria-hidden="true"><b>Change</b> — Axis Magnus Burgundy revisions effective 28 August 2026</span>
            <span aria-hidden="true"><b>Watch</b> — HDFC BizPower adds airline and hotel transfer partners</span>
          </div>
        </div>

        <SpendProvider>
          {/* ── 01 · HERO (full-bleed dark; the clip is the background of the whole
              section, copy + slider + proof card sit ON it — matches /landing). The
              rest of the page stays white/cream/teal; dark hero above a light body is
              intentional. HomeHeroBg carries the clip + scrim at z-index 0. ── */}
          <div className={cx('hm-hero')}>
            <HomeHeroBg />
            <div className={cx('hm-wrap', 'hm-herogrid')}>
              <div>
                <div className={cx('hm-kicker')}>Live<span className={cx('hm-rule')} />India</div>
                <div style={HERO_COMPUTE_VARS}>
                  <HeroCompute />
                </div>
                <p className={cx('hm-method')}>
                  That range is computed from each card&rsquo;s <b>published earn rules</b> — real math, not a
                  self-reported guess. Link a statement and Statement Truth turns the estimate into your{' '}
                  <span className={cx('hm-vf')}>verified</span> spend, today.
                </p>
                <div className={cx('hm-herocta')}>
                  <Link className={cx('hm-btn', 'hm-solid')} href="/login">Compute my cards →</Link>
                  <Link className={cx('hm-btn')} href="#fares">See the method</Link>
                </div>
              </div>
              <div className={cx('hm-heroside')}>
                <div style={HERO_PROOF_VARS}>
                  <HeroProof />
                </div>
              </div>
            </div>
          </div>

          {/* ── 02 · LIVE FARES (cream band) ── */}
          <section className={cx('hm-section', 'hm-band-cream')} id="fares">
            <div className={cx('hm-wrap')}>
              <div className={cx('hm-sechead')}>
                <div className={cx('hm-kicker')}>Live fares<span className={cx('hm-rule')} />Cached</div>
                <h2 className={cx('hm-h2')}>One price, one age stamp, one <span className={cx('hm-accent')}>source</span>.</h2>
                <p className={cx('hm-sub')}>
                  We cache the lowest cash fare on the corridors Indian points actually pay for. Nothing here is a
                  live quote, and we never pretend it is.
                </p>
              </div>
              <div style={FARES_VARS}>
                <FaresBoard />
              </div>
            </div>
          </section>

          {/* ── 03 · WHERE POINTS GO (white ground) — the ₹2,70,000 vs ₹75,000 split,
              computed from ONE real card's redemption_options (not hardcoded). ── */}
          <section className={cx('hm-section')} id="where">
            <div className={cx('hm-wrap')}>
              <div className={cx('hm-sechead')}>
                <div className={cx('hm-kicker')}>Where points<span className={cx('hm-rule')} />Can go</div>
                <h2 className={cx('hm-h2')}>
                  {REDEEM?.balance ?? '1,50,000'} points is a business seat to Singapore, or{' '}
                  {REDEEM?.floor ?? '₹75,000'} in catalogue vouchers.
                </h2>
              </div>
              <div className={cx('hm-redeem')}>
                <div>
                  <p className={cx('hm-sub')}>
                    The same balance is worth {REDEEM?.hi ?? '₹2,70,000'} or {REDEEM?.floor ?? '₹75,000'} depending
                    on where it goes. We show both numbers, and where each one came from.
                  </p>
                  {REDEEM && (
                    <>
                      <div className={cx('hm-redeemnums')}>
                        <div className={cx('hm-rn')}>
                          <div className={cx('hm-rnv', 'hm-rnhi')}>{REDEEM.hi}</div>
                          <div className={cx('hm-rnl')}>Transferred to airline</div>
                        </div>
                        <div className={cx('hm-rn')}>
                          <div className={cx('hm-rnv')}>{REDEEM.floor}</div>
                          <div className={cx('hm-rnl')}>Catalogue vouchers</div>
                        </div>
                      </div>
                      <p className={cx('hm-src')}>
                        <span className={cx('hm-estpill')}><i />Estimated</span>
                        {REDEEM.card} · {REDEEM.balance} pts
                      </p>
                    </>
                  )}
                </div>
                <div className={cx('hm-redeemmedia')}>
                  <HomePointsMedia />
                </div>
              </div>
            </div>
          </section>

          {/* ── 04 · THE METHOD (cream band) — three numbered steps ── */}
          <section className={cx('hm-section', 'hm-band-cream')} id="method">
            <div className={cx('hm-wrap')}>
              <div className={cx('hm-sechead')}>
                <div className={cx('hm-kicker')}>The method<span className={cx('hm-rule')} />03 steps</div>
                <h2 className={cx('hm-h2')}>Every number here traces back to something.</h2>
              </div>
              <div className={cx('hm-steps')}>
                <div className={cx('hm-step')}>
                  <div className={cx('hm-stepn')}>01</div>
                  <h3>Published earn rules</h3>
                  <p>We read each card&rsquo;s rate card as the bank publishes it — base rate, category multipliers, caps, exclusions. Not the marketing copy, the terms.</p>
                </div>
                <div className={cx('hm-step')}>
                  <div className={cx('hm-stepn')}>02</div>
                  <h3>Your spend, your split</h3>
                  <p>The slider applies a category split to the amount you set. Change it and the maths reruns in front of you — nothing is precomputed.</p>
                </div>
                <div className={cx('hm-step')}>
                  <div className={cx('hm-stepn')}>03</div>
                  <h3>Redemption at cached value</h3>
                  <p>Points convert at fares we have actually seen, with the age stamped. When a fare gets old we say so rather than quietly reusing it.</p>
                </div>
              </div>
            </div>
          </section>

          {/* ── 05 · SMART CARD MATCH (teal band) — seven-question stepper ── */}
          <section className={cx('hm-section', 'hm-band-teal')} id="match">
            <div className={cx('hm-wrap')}>
              <div className={cx('hm-sechead')}>
                <div className={cx('hm-kicker')}>Smart Card Match<span className={cx('hm-rule')} />No credit pull</div>
                <h2 className={cx('hm-h2')}>Answer seven questions. Get the card the maths picks.</h2>
                <p className={cx('hm-sub')}>
                  We don&rsquo;t run a credit check and we don&rsquo;t pre-qualify you — nobody in India honestly can from a
                  web form. We compute what each card returns on your spend and show the working.
                </p>
              </div>
              <SmartCardMatch />
            </div>
          </section>

          {/* ── 06 · CARDS AT YOUR SPEND (white ground) — ranked list driven by the
              hero slider (shared SpendContext); reorders live as the slider moves. ── */}
          <section className={cx('hm-section')} id="cards">
            <div className={cx('hm-wrap')}>
              <div className={cx('hm-sechead')}>
                <div className={cx('hm-kicker')}>At your spend<span className={cx('hm-rule')} />Recomputed</div>
                <h2 className={cx('hm-h2')}>What these cards would actually earn you.</h2>
                <p className={cx('hm-sub')}>
                  Ranked by computed annual value at the spend you set above — not by who pays us. Move the slider
                  and this reorders.
                </p>
              </div>
              <HomeCardRanks />
              <p className={cx('hm-ranknote')}>
                Estimated from published earn rules at the spend above. Link a statement to replace these with
                verified figures.
              </p>
            </div>
          </section>

          {/* ── 07 · TOOLS (cream band) — four tools, each linking to its live surface.
              Routes live in the (shell) group; the group is URL-transparent. ── */}
          <section className={cx('hm-section', 'hm-band-cream')} id="tools">
            <div className={cx('hm-wrap')}>
              <div className={cx('hm-sechead')}>
                <div className={cx('hm-kicker')}>Tools<span className={cx('hm-rule')} />Four of them</div>
                <h2 className={cx('hm-h2')}>Four ways to stop leaving money behind.</h2>
              </div>
              <div className={cx('hm-tools')}>
                <Link className={cx('hm-tool')} href="/card-roast">
                  <h3>Roast my card</h3>
                  <p>Tell us what you carry. We grade it against what you spend and say plainly whether the fee earns its keep.</p>
                  <div className={cx('hm-toolgo')}>Grade my card →</div>
                </Link>
                <Link className={cx('hm-tool')} href="/statement-truth">
                  <h3>Statement Truth</h3>
                  <p>Upload a statement and the estimate becomes your verified spend. Nothing leaves your account.</p>
                  <div className={cx('hm-toolgo')}>Upload a statement →</div>
                </Link>
                <Link className={cx('hm-tool')} href="/trip-planner">
                  <h3>Trip planner</h3>
                  <p>Point us at a route and we show which of your points get you there, at cached fares with the age on each.</p>
                  <div className={cx('hm-toolgo')}>Plan a trip →</div>
                </Link>
                <Link className={cx('hm-tool')} href="/card-switch">
                  <h3>Switch wizard</h3>
                  <p>If a better card exists for your spend we say which and by how much. If one doesn&rsquo;t, we say that too.</p>
                  <div className={cx('hm-toolgo')}>Compare cards →</div>
                </Link>
              </div>
            </div>
          </section>

          {/* ── 08 · ASK CIRA (white ground) — chat entry block; the input hands off to
              the live /cira surface via ?q= (CIRA prefills from it). ── */}
          <section className={cx('hm-section')} id="ask">
            <div className={cx('hm-wrap')}>
              <div className={cx('hm-sechead')}>
                <div className={cx('hm-kicker')}>Ask CIRA<span className={cx('hm-rule')} />No login</div>
                <h2 className={cx('hm-h2')}>Ask it anything about your cards.</h2>
              </div>
              <AskCiraEntry />
            </div>
          </section>

          {/* ── 09 · EDITORIAL (white ground) — four hand-picked card faces, each a link
              to its detail page (slugs verified in SEED_CARDS; /card/<slug> resolves). ── */}
          <section className={cx('hm-section')} id="editorial">
            <div className={cx('hm-wrap')}>
              <div className={cx('hm-sechead')}>
                <div className={cx('hm-kicker')}>Editorial<span className={cx('hm-rule')} />Hand-picked</div>
                <h2 className={cx('hm-h2')}>Cards worth knowing about.</h2>
                <p className={cx('hm-sub')}>
                  Chosen by our team — not ranked by anyone&rsquo;s spending, and nobody paid to be here.
                </p>
              </div>
              <div className={cx('hm-strip')}>
                <Link className={cx('hm-facecard')} href="/card/hdfc-infinia" style={{ background: '#14171C' }}>
                  <div className={cx('hm-facetop')}><span className={cx('hm-bk')}>HDFC</span><span className={cx('hm-tier')}>PRIVATE</span></div>
                  <div className={cx('hm-chip')} />
                  <div className={cx('hm-nm2')}>Infinia Metal</div>
                </Link>
                <Link className={cx('hm-facecard')} href="/card/axis-atlas" style={{ background: '#1B2A44' }}>
                  <div className={cx('hm-facetop')}><span className={cx('hm-bk')}>AXIS</span><span className={cx('hm-tier')}>INFINITE</span></div>
                  <div className={cx('hm-chip')} />
                  <div className={cx('hm-nm2')}>Atlas</div>
                </Link>
                <Link className={cx('hm-facecard')} href="/card/icici-amazon-pay" style={{ background: '#8A5A12' }}>
                  <div className={cx('hm-facetop')}><span className={cx('hm-bk')}>ICICI</span><span className={cx('hm-tier')}>CLASSIC</span></div>
                  <div className={cx('hm-chip')} />
                  <div className={cx('hm-nm2')}>Amazon Pay</div>
                </Link>
                <Link className={cx('hm-facecard')} href="/card/sbi-cashback" style={{ background: '#123043' }}>
                  <div className={cx('hm-facetop')}><span className={cx('hm-bk')}>SBI</span><span className={cx('hm-tier')}>CLASSIC</span></div>
                  <div className={cx('hm-chip')} />
                  <div className={cx('hm-nm2')}>Cashback</div>
                </Link>
              </div>
            </div>
          </section>
        </SpendProvider>
      </main>

      {/* ── 10 · FOOTER (cream) — link columns + the full disclosure paragraph. Every
          link is an internal route that resolves; none are dead. Blog is intentionally
          absent (posts deleted). ── */}
      <footer className={cx('hm-footer')}>
        <div className={cx('hm-wrap')}>
          <div className={cx('hm-fgrid')}>
            <div className={cx('hm-fcol')}>
              <Link href="/" className={cx('hm-logo')} style={{ marginBottom: 12 }}>
                <span className={cx('hm-mark')}>C</span>CreditIQ
              </Link>
              <p className={cx('hm-fintro')}>
                Credit card intelligence for India. Every number traceable, every estimate labelled.
              </p>
            </div>
            <div className={cx('hm-fcol')}>
              <h4>Product</h4>
              <Link href="/cards">All cards</Link>
              <Link href="/compare">Compare</Link>
              <Link href="/statement-truth">Statement Truth</Link>
              <Link href="/plans">Pricing</Link>
            </div>
            <div className={cx('hm-fcol')}>
              <h4>Travel</h4>
              <Link href="/trip-planner">Trip planner</Link>
              <Link href="/sweet-spots">Sweet spots</Link>
              <Link href="/transfer-partners">Transfer partners</Link>
              <Link href="/lounge-tracker">Lounges</Link>
            </div>
            <div className={cx('hm-fcol')}>
              <h4>Company</h4>
              <Link href="/about">About</Link>
              <Link href="/disclosures">Disclosures</Link>
              <Link href="/privacy">Privacy</Link>
              <Link href="/terms">Terms</Link>
            </div>
          </div>
          <div className={cx('hm-fbase')}>
            CreditIQ is not a lender and does not issue credit cards. We do not run credit checks and we do not
            pre-qualify applicants. Figures shown are estimates computed from published earn rules unless marked
            verified. Fares are cached and stamped with their age. Where we earn a referral commission it is paid by
            the bank, not by you, and it does not affect rankings.
          </div>
        </div>
      </footer>
    </>
  );
}
