# CardIQ 2.0 — Deployment Checklist

You have a single index.html at `askgogo84/creditIQ` deployed at `credit-iq-beryl.vercel.app`. We're replacing it with a full Next.js 14 project (53 files).

This is the **exact order** to deploy. Follow top-to-bottom.

---

## Step 1 · Replace the GitHub repo (Bareen, 10 min)

The repo currently has just `index.html`. We're swapping it for a Next.js project.

**Option A — Local clone (cleanest):**
```bash
git clone https://github.com/askgogo84/creditIQ.git
cd creditIQ

# Delete the old single-page version
git rm index.html
# Unzip cardiq-2.0.zip into this directory (merge contents)
# (Make sure .git folder stays intact!)

git add .
git commit -m "feat: rebuild as Next.js 14 + Supabase + scraper system

- Editorial dark UX with Fraunces typography
- Smart Match wizard with live spend allocation
- Points Redemption Optimizer with AI advice
- Side-by-side compare (up to 4 cards)
- Card detail pages with real annual value calculator
- Live devaluation ticker
- Manifesto / affiliate-bias-free positioning
- Supabase schema for cards, redemptions, devaluations, applications
- Playwright + Claude Haiku scraper for 12 banks, weekly Vercel Cron
- Affiliate Apply Now framework (env-var driven)
- Admin panel for card management"

git push origin main
```

**Option B — GitHub web UI:**
1. Go to github.com/askgogo84/creditIQ
2. Delete `index.html` (Edit → trash icon → Commit)
3. Upload all 53 files via "Add file → Upload files" preserving folder structure
4. Commit

Vercel auto-deploys on push. At this point, **the site works with seed data** (19 hand-curated cards) — no Supabase needed yet.

---

## Step 2 · Create Supabase project (Gogo, 2 min)

1. Go to https://supabase.com → Sign in → New project
2. Name: `cardiq` · Region: Mumbai (`ap-south-1`) · Plan: Free
3. Wait ~90 seconds for provisioning
4. **Project Settings → API**, copy three values:
   - `URL` → save as `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public key` → save as `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role secret key` → save as `SUPABASE_SERVICE_ROLE_KEY` (⚠️ never expose this publicly)

---

## Step 3 · Run the schema (Gogo or Bareen, 1 min)

1. In Supabase, click **SQL Editor** in the left sidebar → **New query**
2. Open `supabase/migrations/001_initial.sql` from the repo
3. Copy-paste entire contents into the SQL editor
4. Click **Run**
5. You should see "Success. No rows returned" — five tables created (cards, redemptions, devaluation_log, applications, user_points)

---

## Step 4 · Add environment variables to Vercel (Bareen, 5 min)

Vercel Dashboard → `credit-iq-beryl` project → **Settings → Environment Variables**.

Add these (mark all environments: Production, Preview, Development):

```
NEXT_PUBLIC_SUPABASE_URL=<from Step 2>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<from Step 2>
SUPABASE_SERVICE_ROLE_KEY=<from Step 2>
ANTHROPIC_API_KEY=<your Anthropic console key>
ADMIN_PASSWORD=<pick something — used to access /admin>
CRON_SECRET=<run: openssl rand -hex 32>
```

Then click **Deployments → ⋯ on latest → Redeploy** (so env vars take effect).

---

## Step 5 · Seed the database (Bareen, 1 min)

From local machine where you have the repo cloned:

```bash
# Install deps
npm install

# Pull env vars from Vercel (or copy .env.example → .env.local and fill)
npx vercel env pull .env.local

# Push the 19 seed cards to Supabase
npm run seed
```

Expected output:
```
Seeding 19 cards...
  ✓ HDFC Infinia Metal Edition
  ✓ HDFC Regalia Gold
  ✓ HDFC Millennia
  ... (16 more)
Done.
```

Verify in Supabase: **Table Editor → cards** → 19 rows.

---

## Step 6 · Verify production (Gogo, 2 min)

Visit https://credit-iq-beryl.vercel.app and check:

- [ ] Home loads with hero + 3 stacked cards animating in
- [ ] Devaluation ticker scrolls (under hero, red banner)
- [ ] Click any card tile → detail page renders with breakdown calculator
- [ ] `/smart-match` → sliders update results live
- [ ] `/optimize` → click "Get AI strategy" → Claude response in 3-5 sec (requires ANTHROPIC_API_KEY)
- [ ] Add 2-3 cards via the + button → compare tray appears at bottom → click Compare → side-by-side renders
- [ ] `/admin` → enter ADMIN_PASSWORD → 19 cards listed

---

## Step 7 · Affiliate accounts (Gogo, parallel — 3-14 days)

These run in parallel and start earning the day the IDs are added to Vercel env vars:

**Apply today:**
- **Paisabazaar Affiliate Pro:** https://www.paisabazaar.com/affiliates (fastest, 3-7 days)
- **BankBazaar Partners:** https://www.bankbazaar.com/partners.html (5-10 days)
- **CashKaro:** https://cashkaro.com/blog/become-a-cashkaro-partner (5-7 days)

**Apply this week (higher payout, slower):**
- HDFC affiliate: contact `affiliate@hdfcbank.com`
- SBI Card: through SBICAPS affiliate program
- Axis: via Axis Direct affiliate inquiry form
- ICICI: through ICICIPru affiliate desk

When IDs arrive, just add to Vercel env vars (`PAISABAZAAR_PARTNER_ID=...` etc.) and Apply Now buttons auto-route through them.

---

## Step 8 · Enable weekly scraper (after Vercel Pro upgrade, optional)

**Important:** Vercel Hobby plan caps function timeout at 60 seconds. The scraper needs 5+ minutes.

**Two options:**

**Option A — Upgrade to Vercel Pro ($20/month):** Cron runs `/api/scrape` every Sunday 2:00 AM IST automatically. No code changes needed; `vercel.json` already configured.

**Option B — Move scraper to Render/Railway ($5/month worker):** Tell Bareen, I'll write the migration script.

For the VC pitch, **Option A is the right move** — keeps everything on one stack.

To trigger manual scrape from the admin panel: `/admin` → login → click any bank button. (First full crawl across all 12 banks takes ~6 hours — let it run overnight.)

---

## What works *without* completing every step

The platform is functional at each stage:

| After | Status |
|---|---|
| Step 1 (deploy) | ✅ Full UI, 19 seed cards, all calculators work |
| + Step 4 (Anthropic key) | ✅ AI redemption advice on `/optimize` |
| + Steps 2-5 (Supabase) | ✅ Data editable via admin, decoupled from code |
| + Step 7 (affiliates) | ✅ Apply Now starts earning |
| + Step 8 (scraper) | ✅ Auto-updates weekly, scales to 60+ cards |

---

## VC demo path (when meeting)

1. **Open landing page** → "Notice the devaluation ticker — no other site tracks this."
2. **Click HDFC Infinia card** → "Real annual value at ₹50K/month spend: ₹X. Now drag the slider — watch it recalculate live including caps and milestones."
3. **Go to Smart Match** → "Adjust spend allocation. Top 12 cards re-rank in real time, with approval probability per card based on income + CIBIL."
4. **Open Optimize Points** → "User has 50,000 Infinia points. Click 'Get AI strategy' — Claude generates expert redemption advice with specific sweet-spot routes."
5. **Show Manifesto** → "Here's the wedge. Paisabazaar earns ₹2,000+ per approval. We don't. Our rankings can't be bought."

The whole demo runs in under 4 minutes. That's the goal.
