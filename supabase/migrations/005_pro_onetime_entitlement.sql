-- 005_pro_onetime_entitlement.sql
-- CreditIQ — Pro one-time entitlement (order-based).
-- Project: yazpphublutdodahfwvr ("cardiq") — the CreditIQ DB, NOT the WhatsApp bot.
-- Hand-apply in the Supabase SQL editor; confirm with the SELECTs at the bottom.
-- Every statement is idempotent — safe to run more than once.
--
-- INERT until STEP 3 points Razorpay at the order path AND RAZORPAY_MODE=orders is set.
-- Applying this early changes no live behaviour: nothing writes pro_until until the
-- webhook's payment.captured branch is enabled.

-- ============================================================================
-- 1) Entitlement columns on the existing user_profiles (PK user_id -> auth.users).
-- ============================================================================
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS pro_until         TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS pro_plan          TEXT,   -- monthly | sixmonth | twelvemonth
  ADD COLUMN IF NOT EXISTS pro_last_order_id TEXT;    -- informational only; NOT the idempotency key

-- 1a) Money columns must NEVER be end-user-writable. user_profiles carries a FOR ALL
--     "update own profile" policy (auth.uid() = user_id), which would otherwise let a
--     signed-in user set their own pro_until via the client. RLS is row-scoped; the
--     table privilege is the lock. Only the service role (webhook) grants Pro.
--
--     A COLUMN-SCOPED revoke here is a SILENT NO-OP: Postgres will not let a per-column
--     REVOKE carve a hole out of Supabase's table-level INSERT/UPDATE grant to
--     anon/authenticated, so `REVOKE INSERT (pro_until,...)` leaves the money columns
--     writable. Revoke at the TABLE level instead. SELECT (and REFERENCES) are untouched,
--     so a user may still READ their own entitlement; anon/authenticated hold no
--     INSERT/UPDATE on user_profiles. Safe because every write to this table already
--     goes through the service role (onboarding/user-city/pro routes), which bypasses
--     grants — no client uses an authenticated-JWT write here.
REVOKE INSERT, UPDATE ON public.user_profiles FROM anon, authenticated;

-- ============================================================================
-- 2) Order idempotency ledger. NEW table — subscription_events is the subscription
--    webhook's audit log (subscription-keyed, no order_id), so orders get their own.
--    UNIQUE(razorpay_order_id) IS the idempotency key: "processed-ever", not
--    "processed-last" (pro_last_order_id is never consulted for dedupe).
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.pro_order_events (
  id                  BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  razorpay_order_id   TEXT NOT NULL,
  razorpay_payment_id TEXT,
  user_id             UUID,
  plan                TEXT,
  amount_paise        INTEGER,
  months              INTEGER,
  applied_pro_until   TIMESTAMPTZ,   -- the pro_until we granted, for audit
  event_type          TEXT,
  raw_payload         JSONB,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS pro_order_events_order_id_key
  ON public.pro_order_events (razorpay_order_id);
CREATE INDEX IF NOT EXISTS pro_order_events_user_id_idx
  ON public.pro_order_events (user_id);

-- Ledger is service-role only. RLS on + no policy => deny-all to anon/authenticated;
-- the service role bypasses RLS.
ALTER TABLE public.pro_order_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.pro_order_events FROM anon, authenticated;

-- ============================================================================
-- 3) extend_pro — atomic, idempotent, order-based grant into user_profiles.
--    Returns exactly one of:
--      'applied'         pro_until extended, ledger row written
--      'already_applied' this order_id was already granted (idempotent no-op)
--      'no_such_user'    p_user_id is not a real auth.users id — NOTHING written, the
--                        order_id is left UN-recorded so a replay can still grant once
--                        the id binds. Caller MUST log loudly + alert. Never returns NULL.
-- ============================================================================
CREATE OR REPLACE FUNCTION public.extend_pro(
  p_order_id     TEXT,
  p_user_id      UUID,
  p_plan         TEXT,
  p_months       INTEGER,
  p_payment_id   TEXT     DEFAULT NULL,
  p_amount_paise INTEGER  DEFAULT NULL,
  p_event_type   TEXT     DEFAULT NULL,
  p_raw          JSONB    DEFAULT NULL
) RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_plan  TEXT    := CASE WHEN lower(coalesce(p_plan,'')) IN ('monthly','sixmonth','twelvemonth')
                          THEN lower(p_plan) ELSE 'monthly' END;
  v_mon   INTEGER := CASE WHEN p_months IS NULL OR p_months < 1 THEN 1 ELSE p_months END;
  v_until TIMESTAMPTZ;
BEGIN
  IF p_order_id IS NULL OR p_order_id = '' THEN
    RAISE EXCEPTION 'extend_pro: p_order_id is required';
  END IF;
  IF p_user_id IS NULL THEN
    RAISE WARNING 'extend_pro: null user for paid order % — NOT granted', p_order_id;
    RETURN 'no_such_user';
  END IF;

  -- Validate the buyer exists BEFORE claiming the order, so an unmatched paid order
  -- stays replayable (nothing is written on this path).
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = p_user_id) THEN
    RAISE WARNING 'extend_pro: NO auth user % for paid order % — entitlement NOT granted',
      p_user_id, p_order_id;
    RETURN 'no_such_user';
  END IF;

  -- Idempotency: claim the order_id. A duplicate delivery collides here -> benign no-op.
  BEGIN
    INSERT INTO public.pro_order_events (
      razorpay_order_id, razorpay_payment_id, user_id, plan, amount_paise, months, event_type, raw_payload
    ) VALUES (
      p_order_id, p_payment_id, p_user_id, v_plan, p_amount_paise, v_mon, p_event_type, p_raw
    );
  EXCEPTION WHEN unique_violation THEN
    RETURN 'already_applied';
  END;

  -- Grant. GREATEST(now(), existing pro_until) + months => a renewal bought early
  -- EXTENDS rather than overwrites. Creates the profile row if the user has none.
  INSERT INTO public.user_profiles (user_id, pro_until, pro_plan, pro_last_order_id, updated_at)
  VALUES (p_user_id, now() + make_interval(months => v_mon), v_plan, p_order_id, now())
  ON CONFLICT (user_id) DO UPDATE
    SET pro_until         = greatest(now(), coalesce(user_profiles.pro_until, now())) + make_interval(months => v_mon),
        pro_plan          = excluded.pro_plan,
        pro_last_order_id = excluded.pro_last_order_id,
        updated_at        = now()
  RETURNING pro_until INTO v_until;

  UPDATE public.pro_order_events SET applied_pro_until = v_until WHERE razorpay_order_id = p_order_id;
  RETURN 'applied';
END;
$$;

-- ============================================================================
-- 4) Lock down execution: service-role only (the webhook's key).
-- ============================================================================
REVOKE ALL     ON FUNCTION public.extend_pro(text,uuid,text,integer,text,integer,text,jsonb) FROM public, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.extend_pro(text,uuid,text,integer,text,integer,text,jsonb) TO service_role;

-- ============================================================================
-- 5) Confirm it landed (rule: verify with a SELECT, never trust "applied").
-- ============================================================================
-- SELECT column_name FROM information_schema.columns
--   WHERE table_name='user_profiles' AND column_name IN ('pro_until','pro_plan','pro_last_order_id');  -- expect 3 rows
-- SELECT to_regclass('public.pro_order_events');                          -- expect: pro_order_events
-- SELECT 1 FROM pg_proc WHERE proname='extend_pro';                       -- expect: 1
-- SELECT proacl FROM pg_proc WHERE proname='extend_pro';                  -- expect service_role=X only
-- SELECT grantee, privilege_type FROM information_schema.column_privileges
--   WHERE table_name='user_profiles' AND column_name='pro_until';         -- expect NO anon/authenticated INSERT/UPDATE
