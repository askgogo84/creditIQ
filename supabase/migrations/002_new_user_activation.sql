-- 002_new_user_activation.sql
-- Fixes for the first external tester's activation blockers.
-- The live schema was edited directly in Supabase, so supabase_user_profiles.sql is stale.
-- Run this in the Supabase SQL editor (project: yazpphublutdodahfwvr / CreditIQ Consumer).
-- Every statement is idempotent — safe to run more than once.

-- ============================================================================
-- 1) user_profiles: guarantee the columns the app uses exist, and DOB is OPTIONAL.
--    This is the authoritative fix for "date of birth is mandatory / blocks signup".
--    The client and API already send NULL when DOB is blank; a NOT NULL constraint
--    on date_of_birth in the DB is what silently fails the onboarding profile write.
-- ============================================================================
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS display_name        TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS date_of_birth       DATE;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS home_airport        TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS onboarding_complete BOOLEAN DEFAULT FALSE;

-- Drop any NOT NULL on date_of_birth. No-op if it is already nullable.
ALTER TABLE user_profiles ALTER COLUMN date_of_birth DROP NOT NULL;

-- ============================================================================
-- 2) OPTIONAL — add the tester's Kotak airline cards to the SEARCHABLE catalogue.
--    Not required for activation: the new "Add it manually" fallback in onboarding
--    already covers ANY card that isn't in the catalogue. This only makes these
--    cards findable by search.
--    NOTE: this assumes `cards.id` is the primary key and that the columns below are
--    the only NOT NULL ones. If your live `cards` table has other required columns
--    (e.g. iq_score, slug, category), add them here before running.
-- ============================================================================
INSERT INTO cards (id, name, bank, reward_currency, active)
VALUES
  ('kotak-indigo-6e',     'Kotak IndiGo 6E Rewards XL Credit Card', 'Kotak', '6E Rewards', true),
  ('kotak-indigo-6e-base','Kotak IndiGo 6E Rewards Credit Card',    'Kotak', '6E Rewards', true)
ON CONFLICT (id) DO NOTHING;
