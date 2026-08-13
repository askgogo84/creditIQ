-- 006_first_run_choice.sql
-- CreditIQ — first-run pricing-modal state.
-- Project: yazpphublutdodahfwvr ("cardiq") — the CreditIQ DB, NOT the WhatsApp bot.
-- Hand-apply in the Supabase SQL editor; confirm with the SELECT at the bottom.
-- Idempotent — safe to run more than once.

-- One column: when the first-run pricing modal has been resolved (any choice, incl.
-- "Continue free"). NULL => show the modal; set => never again. Written server-side
-- only, by /api/first-run, exactly like the pro_* columns.
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS plan_chosen_at TIMESTAMPTZ;

-- No new column-scoped REVOKE: migration 005 already revoked INSERT/UPDATE at the
-- TABLE level from anon, authenticated (a column-scoped revoke is a silent no-op on
-- Supabase's table-wide grant). So plan_chosen_at is already unwritable by end users;
-- only the service role (the /api/first-run stamp) can set it. Re-assert defensively
-- (idempotent, harmless if 005 is already applied):
REVOKE INSERT, UPDATE ON public.user_profiles FROM anon, authenticated;

-- Confirm it landed (rule: verify with a SELECT, never trust "applied").
-- SELECT column_name, data_type FROM information_schema.columns
--   WHERE table_name='user_profiles' AND column_name='plan_chosen_at';   -- expect 1 row, timestamp with time zone
