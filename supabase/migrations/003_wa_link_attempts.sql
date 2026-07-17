-- 003_wa_link_attempts.sql
-- Per-code attempt cap for WhatsApp link-code redemption (defense-in-depth vs
-- brute-force). Per-SENDER throttling lives in the AskGogo bot, not here — this
-- endpoint receives only { code }, no sender identity.
--
-- NOTE: wa_link_codes is not defined in repo migrations (it lives in live
-- Supabase), so this ALTERs the live table. Apply it BEFORE deploying the updated
-- app/api/wa/redeem/route.ts, which references the `attempts` column and the
-- increment_wa_link_attempts() function.

alter table public.wa_link_codes
  add column if not exists attempts integer not null default 0;

-- Atomic per-code failed-attempt increment. Called on every failed redeem of an
-- existing code; no-ops when the code was never issued (0 rows matched).
create or replace function public.increment_wa_link_attempts(p_code text)
returns void language sql as $$
  update public.wa_link_codes set attempts = attempts + 1 where code = p_code;
$$;

-- Only the service role (used by the redeem route) may call it.
grant execute on function public.increment_wa_link_attempts(text) to service_role;
