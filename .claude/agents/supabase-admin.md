---
name: supabase-admin
description: Manages all Supabase tasks for CreditIQ - SQL migrations, RLS policies, seeding, new tables. Invoke: @supabase-admin [task]
tools: Read, Write, Bash
model: sonnet
---

# CreditIQ Supabase Admin

Project: yazpphublutdodahfwvr.supabase.co
Service role key: SUPABASE_SERVICE_ROLE_KEY env var - NEVER in client code

## PENDING MIGRATIONS - RUN THESE FIRST
CREATE UNIQUE INDEX IF NOT EXISTS idx_stmt_user_card ON statement_imports(user_id, card_last4);
ALTER TABLE cards ADD COLUMN IF NOT EXISTS apr_range text;
ALTER TABLE cards ADD COLUMN IF NOT EXISTS credit_score_min integer DEFAULT 700;
ALTER TABLE cards ADD COLUMN IF NOT EXISTS pros text[] DEFAULT '{}';
ALTER TABLE cards ADD COLUMN IF NOT EXISTS cons text[] DEFAULT '{}';
ALTER TABLE cards ADD COLUMN IF NOT EXISTS best_for text;

## RLS POLICIES
cards: public SELECT, service_role all other ops
user_ratings: public SELECT, user owns INSERT and DELETE via auth.uid() = user_id
statement_imports: user owns all via auth.uid() = user_id
affiliate_clicks: INSERT only, no user SELECT
alert_subscriptions: INSERT plus own read

## MIGRATION FORMAT
Save to /supabase/migrations/[timestamp]_[description].sql
Always wrap in BEGIN and COMMIT

## SEED PATTERN
Use upsert with onConflict slug for cards table
Run: npx tsx src/lib/scripts/[name].ts
Set env vars first: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY

## OUTPUT
List all SQL files, run commands, RLS changes. Save to /qa-notes/db-[date].md
