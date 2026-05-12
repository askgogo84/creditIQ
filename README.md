# CardIQ 2.0

> The honest credit card intelligence India needed.

A Next.js 14 + Supabase platform that ranks Indian credit cards by **real annual value** to the user, not by affiliate payouts. Built by [AskGogo](https://askgogo.in).

## Why this exists

Every credit card comparison site in India (Paisabazaar, BankBazaar, CardInsider, etc.) earns ₹500–3,000 per approved application. Rankings are bought, not earned. CardIQ rebuilds the category around three principles:

1. **Real annual value** — net rupee gain after fees, caps, milestones, and redemption haircuts
2. **Live devaluation tracking** — every MITC update logged within days
3. **Open methodology** — every score shows its math

## Quick start

```bash
npm install
npm run dev
```

Open http://localhost:3000. The app runs with **15 hand-curated seed cards** even without Supabase configured.

## Production setup

### 1. Supabase (2 minutes)

1. Go to [supabase.com](https://supabase.com), create a new project
2. In SQL Editor, paste `supabase/migrations/001_initial.sql` and run
3. From Project Settings → API, copy:
   - `URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` → `SUPABASE_SERVICE_ROLE_KEY`

### 2. Environment variables

Copy `.env.example` to `.env.local` and fill in. The minimum set:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
ANTHROPIC_API_KEY=sk-ant-api03-...
ADMIN_PASSWORD=change-me
CRON_SECRET=$(openssl rand -hex 32)
```

### 3. Seed the database

```bash
npm run seed
```

This uploads all 15 curated cards to Supabase.

### 4. Deploy to Vercel

```bash
# Already a Vercel project at credit-iq-beryl.vercel.app
git push origin main
```

Vercel will auto-deploy. Add the env vars from step 2 to Vercel project settings.

## Architecture

```
app/
├── page.tsx                  # Home (hero, ticker, features, manifesto, catalog)
├── smart-match/              # Live spend wizard with approval probability
├── optimize/                 # Points redemption optimizer (KILLER FEATURE)
├── compare/                  # Side-by-side comparison
├── card/[slug]/              # Card detail with real annual value calculator
├── about/                    # Manifesto + full devaluation log
├── admin/                    # Internal panel (password-protected)
└── api/
    ├── claude/redemption     # AI redemption strategy
    ├── scrape                # Weekly Vercel cron + manual trigger
    ├── apply/[cardId]        # Affiliate Apply Now redirect
    └── admin/*               # Admin operations

lib/
├── types.ts                  # Domain model
├── engine.ts                 # Annual value calculator + match scoring
├── redemption.ts             # Points optimizer
├── affiliate.ts              # Apply Now URL builder
├── supabase.ts               # DB client with seed fallback
├── data/seed-cards.ts        # 15 curated cards
└── scrapers/                 # Playwright + Claude parser for 12 banks
```

## Phase 3: Scraping system

Weekly Vercel Cron (`0 2 * * 0` = Sundays 2:00 IST) runs `/api/scrape`. The cron:

1. Visits each bank's credit card catalog page (12 banks)
2. Crawls individual card detail pages
3. Sends raw HTML to Claude Haiku
4. Claude returns structured `CreditCard` JSON
5. Upserts to Supabase `cards` table

**Important:** First crawl takes ~6 hours. Vercel Hobby plan has 60-second function timeout — if scraper exceeds this, deploy to **Vercel Pro** ($20/month, gives 5-minute timeout) OR move scraper to Render/Railway as a separate worker.

To trigger manually from admin panel: `/admin` → password → bank button.

## Phase 3: Affiliate Apply Now

`/api/apply/[cardId]` redirects to:
1. **Direct bank affiliate** (highest payout) — if `HDFC_AFFILIATE_ID` etc. configured
2. **Aggregator** (Paisabazaar/BankBazaar) — if those IDs configured
3. **Bank homepage** (fallback, no commission)

**Affiliate signup timeline:**
- Paisabazaar Pro: 3–7 days
- BankBazaar Partners: 5–10 days
- HDFC, SBI, Axis, ICICI direct: 10–14 days, may require GST/business proof

Apply for all in parallel. CardIQ generates revenue from the day the first ID is plugged in.

## Tech stack

- **Framework:** Next.js 14 (App Router)
- **Styling:** Tailwind CSS with custom design tokens
- **Fonts:** Fraunces (display, Google Fonts) + Geist Sans/Mono
- **State:** Zustand (persisted to localStorage for compare tray)
- **Animation:** Framer Motion
- **Database:** Supabase (Postgres)
- **AI:** Claude Haiku via Anthropic SDK
- **Scraping:** Playwright (Chromium headless)
- **Hosting:** Vercel with Cron

## Roadmap

- [x] **Phase 1:** UX redesign, smart match, points optimizer, card details, compare
- [x] **Phase 2:** Supabase schema, seed script, admin panel
- [x] **Phase 3:** Playwright scraper, Vercel Cron, affiliate Apply Now framework
- [ ] **Phase 4:** Statement PDF upload + MCC categorization
- [ ] **Phase 5:** Multi-card stack recommender
- [ ] **Phase 6:** User accounts + points balance tracking
- [ ] **Phase 7:** Chrome extension (auto-detect best card at checkout)

## License

Proprietary — AskGogo, 2026.
