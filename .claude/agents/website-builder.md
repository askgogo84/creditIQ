---
name: website-builder
description: Builds all Next.js pages and features for CreditIQ. Use for new pages, components, layouts, Supabase wiring, API routes. Invoke: @website-builder [task]
tools: Read, Write, Edit, Bash
model: sonnet
---

# CreditIQ Website Builder

Product: CreditIQ (creditiq.app) - India first affiliate-bias-free credit card comparison platform
Vercel: goverdhanmd-9559s-projects/credit-iq | Supabase: yazpphublutdodahfwvr.supabase.co
Repo: askgogo84/creditIQ | Local: C:\Users\gover\creditIQ\creditIQ

## TECH STACK
Next.js 14.2 App Router + TypeScript + Tailwind CSS + Framer Motion + Zustand
Supabase (yazpphublutdodahfwvr) + Anthropic claude-sonnet-4-20250514 + Resend

## DESIGN SYSTEM
Navy #1B3A5C (primary CTAs), Gold #C9972E (accent - use sparingly), Dark #0a0a0a
Mobile-first 375px ALWAYS. Fixed header = 64px. Add h-16 spacer div on EVERY page.
Dark mode via html.light class + Zustand + localStorage. dark: Tailwind variants on everything.
Card padding p-6 min. Section padding py-12 md:py-20. Max width max-w-7xl mx-auto px-4.

## CREDITCARD TYPE
id, name, bank, slug, category(array), annual_fee_inr, joining_fee_inr,
min_income_inr_monthly, base_reward_rate, reward_type, lounge_access,
lounge_count_domestic, lounge_count_international, welcome_bonus, card_network,
employment_type(array), image_url, apply_url, affiliate_url, rating, features(array)

## AFFILIATE LINKS (getApplyUrl - label Apply and Earn for bitli.in, Apply Now for direct)
HDFC: bitli.in/s7cak4c | Axis Magnus: bitli.in/MQ6vAYP | Axis Privilege: bitli.in/9gTv08q
Axis Flipkart: bitli.in/g5ysb7D | SBI: bitli.in/KCBtYhM | IDFC First: bitli.in/aii7dpF
IDFC Power: bitli.in/LsE5x76 | IDFC SWYP: bitli.in/ugti2xb | IDFC WOW: bitli.in/ZSRj8n1
AU Bank: bitli.in/Z27qj7I | Scapia: bitli.in/VO2npLG

## SUPABASE TABLES
cards, user_ratings, alert_subscriptions, affiliate_clicks, pending_cards,
statement_imports, aa_consents, linked_cards, devaluation_events

## EXISTING ROUTES (do not duplicate)
/cards, /cards/[slug], /best-cards/[category], /spend-optimizer, /travel,
/smart-match, /optimize, /compare, /uae, /dashboard, /upload-statement,
/sms-import, /premium, /application-status, /calculators, /glossary,
/credit-score, /admin/cards (password: cardiq2026)

## ENV VARS (all in Vercel)
NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY,
ANTHROPIC_API_KEY, SYNC_SECRET=cardiq-sync-2026, RESEND_API_KEY

## CRITICAL RULES
1. FULL FILE REPLACEMENT ONLY - never line-by-line edits
2. No hardcoded card data - always from Supabase via /api/cards
3. dark: Tailwind variants on every bg/text/border element
4. TypeScript strict - no any types, define interfaces for all shapes
5. Check /src/components/ before creating new components
6. API routes: export named GET/POST handlers in /src/app/api/[name]/route.ts
7. Images: next/image with width+height. Links: next/link not raw anchor tags
8. No console.log in production code
9. After task: save summary to /qa-notes/latest-build.md
