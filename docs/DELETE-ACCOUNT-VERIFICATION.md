# Delete-Account — Verification Harness & Merge Plan

**Written 3 Aug 2026. Plan only — nothing implemented, no cherry-pick done.**
This file is self-contained: it holds everything needed to resume after a context reset.

---

## Situation (read first to resume)

CreditIQ needs a working account-deletion flow for the **Google Play Data Safety** form.
The pieces exist but are **split across two places and neither is on `main`/production**:

| Piece | Where it lives | State |
|---|---|---|
| Page `app/delete-account/page.tsx` | working tree on `main`, **untracked** | never committed on any branch |
| API `app/api/delete-account/route.ts` | branch **`fix/account-deletion-complete`**, commit **`0c5e02ba`** | not on main, not merged (branch ~155 behind main, forked at `3f8fe69c` 2026-07-08) |
| Data-safety doc `store/data-safety.md` | same commit `0c5e02ba` | not on main |
| In-app link ("You → Delete account") | **nowhere** (no ref, no branch) | does not exist |

**Production check:** `GET https://creditiq.app/delete-account` → **404** (confirmed). Page not deployed; API not on main.

**Compliance state — working assumption (b):** the page header says it was written for the Data Safety form, so assume the URL is **declared to Google and currently 404s** until Play Console confirms otherwise. If it turns out **not** declared, nothing in this plan changes — only the urgency (backlog vs live policy violation).

**The three states (never be in c):**
- (a) not deployed & not declared → backlog
- (b) declared but 404 → **live compliance problem** (working assumption)
- (c) page deployed but API missing/broken → the trap. Avoid by landing API before page.

### Cherry-pick facts (item 1)
- Commit `0c5e02ba` is **purely additive** — 2 files, 219 insertions, 0 deletions, no existing file modified → **a cherry-pick cannot conflict**. Use cherry-pick, not rebase.
  ```
  git checkout main; git pull
  git checkout -b fix/account-deletion-live
  git cherry-pick 0c5e02ba
  ```
- **No code drift:** the route imports only `next/server` and `@supabase/supabase-js` — zero `@/lib/*` coupling, so 155 commits of main changes to auth helpers / supabase client wrappers cannot have broken it. Builds its own admin client inline.
- **Env present:** needs `SUPABASE_SERVICE_ROLE_KEY`, already used by `app/api/aa/*` and `app/api/admin/*` on main → configured in prod.
- **The real risk is SCHEMA, and the repo can't certify it.** Migrations 002/003/004 (added since fork) introduce no new user-keyed table (002 alters `user_profiles` + inserts catalogue cards; 003 alters `wa_link_codes`, keyed by `code`; 004 `cached_fares` is global). BUT 002/003 both state in-file the live schema "was edited directly in Supabase" and `wa_link_codes` "lives in live Supabase, not repo migrations." **The live DB is the source of truth — verify completeness there (the sweep below).**

### What the route deletes (item 2)
Token-only identity (never a body `userId`), service-role mutations, **fail-loud** (re-counts after delete; HTTP 500 + `remainingTables` if any row survives; never `success:true` while PII remains).

| Group | Tables |
|---|---|
| Identity/login | auth user (email/phone) via `auth.admin.deleteUser` |
| Profile | `user_profiles` |
| Cards | `manual_cards`, `statement_imports`, `personal_cards` (+`personal_card_transactions` cascade) |
| AA | `aa_consents`, `linked_cards` (via `consent_handle`) |
| Points/rewards | `user_points`, `redemptions` |
| Billing | `subscriptions`, `subscription_events` (via `razorpay_subscription_id`), `personal_entitlements` |
| Alerts | `alert_subscriptions` (via `ilike(email)`) |
| Other | `applications`, `hook_events` |

The page's 4 promises all map onto this set; the route deletes a **superset** → no under-promise on known tables. Two false-statement risks remain, both **live-DB questions**:
1. **Completeness (serious):** the fail-loud re-checks only the same hardcoded list → **blind by construction** to any user-data table the list omits. Can return `success:true` while PII survives; the page then says "permanently deleted." The `information_schema` sweep below is the only independent oracle.
2. **Self-disclosed v1 limit:** an `alert_subscriptions` row created with an email **different** from the auth email has no user id to link → survives deletion. Route only matches the auth email. Decide: disclose on page, or sweep via support.

### Order of operations (item 3) — so we're never in state (c)
1. **API first.** Cherry-pick → run the **reconciled-list** query → close any gap in the route → confirm env → merge to `main`. API alone in prod is inert (no page, no link). **Gate: prove end-to-end deletion against a burner account (harness below) before moving on.**
2. **Page second.** Only after API merged **and** verified, commit the untracked `app/delete-account/page.tsx` to `main`.
3. **Link third.** Add "You → Delete account" (in-app + mobile app) only after the page is live and verified.

**Active trap:** the untracked page sits in the working tree on `main`. A careless `git add app/` deploys the page without the API → instant state (c). Keep it out of any commit until step 2.

---

## Verification Harness

Everything runs in the **Supabase SQL editor, project `yazpphublutdodahfwvr` (CreditIQ Consumer)**. The editor runs as `service_role` and **bypasses RLS** — required, or RLS hides rows and hands you a false pass. Never run this sweep through an anon/authed client.

### Block 0 — one-time setup: audit table, subject config, and the sweep function

Run once. Paste the burner's identity into `_del_subject` (get the uuid from `select id,email,phone from auth.users where email='<burner>';`).

```sql
-- throwaway harness objects (dropped in Block 7)
create table if not exists public._del_audit (
  phase text, table_name text, column_name text,
  match_value text, row_count bigint, note text
);
create table if not exists public._del_subject (
  user_id text, email text, phone text
);

-- ▼▼ EDIT THESE THREE, then run once ▼▼
truncate public._del_subject;
insert into public._del_subject(user_id, email, phone)
values ('PASTE-BURNER-UUID', 'burner@example.com', '+919999999999');
-- ▲▲ ---------------------------------- ▲▲

-- The sweep: for the subject, count matching rows in EVERY public base table
-- that has any user-identifying column. Errors per-column are recorded as -1
-- (i.e. "not proven empty") so a bad cast can't silently pass.
create or replace function public._del_sweep(p_phase text)
returns void language plpgsql as $$
declare
  r record; v_uid text; v_email text; v_phone text;
  v_sql text; v_cnt bigint; v_val text;
begin
  select user_id, email, phone into v_uid, v_email, v_phone
  from public._del_subject limit 1;

  delete from public._del_audit where phase = p_phase;

  for r in
    select c.table_name, c.column_name
    from information_schema.columns c
    join information_schema.tables t
      on t.table_schema = c.table_schema and t.table_name = c.table_name
    where c.table_schema = 'public'
      and t.table_type   = 'BASE TABLE'
      and c.table_name not in ('_del_audit','_del_subject')
      and lower(c.column_name) in (
        'user_id','owner_user_id','uid','auth_id','profile_id','created_by',
        'account_id','user_uuid','user_uid','member_id','customer_id','owner',
        'email','user_email','contact_email','subscriber_email',
        'phone','mobile','msisdn','phone_number','contact_phone'
      )
  loop
    if lower(r.column_name) like '%email%' then
      if coalesce(v_email,'') = '' then continue; end if;
      v_val := lower(v_email);
      v_sql := format('select count(*) from public.%I where lower(%I::text) = %L',
                      r.table_name, r.column_name, v_val);
    elsif lower(r.column_name) in ('phone','mobile','msisdn','phone_number','contact_phone') then
      if coalesce(v_phone,'') = '' then continue; end if;
      v_val := regexp_replace(v_phone, '\D', '', 'g');
      v_sql := format(
        'select count(*) from public.%I where regexp_replace(%I::text, ''\D'', '''', ''g'') = %L',
        r.table_name, r.column_name, v_val);
    else
      if coalesce(v_uid,'') = '' then continue; end if;
      v_val := v_uid;
      v_sql := format('select count(*) from public.%I where %I::text = %L',
                      r.table_name, r.column_name, v_val);
    end if;

    begin
      execute v_sql into v_cnt;
      insert into public._del_audit values (p_phase, r.table_name, r.column_name, v_val, v_cnt, null);
    exception when others then
      insert into public._del_audit values (p_phase, r.table_name, r.column_name, v_val, -1, sqlerrm);
    end;
  end loop;
end $$;
```

*(Column list widened past user_id/owner_user_id/email/phone — added `user_uid`, `member_id`, `customer_id`, `owner`, and `%email%`/contact variants. Discovery is only as complete as this list; see the backstop in Caveats.)*

### Block 1 — DISCOVERY (run before seeding, just to see the surface)

Read-only. Shows every table+column the sweep will hit, so you can eyeball the surface first.

```sql
select c.table_name,
       string_agg(distinct c.column_name, ', ' order by c.column_name) as id_columns
from information_schema.columns c
join information_schema.tables t
  on t.table_schema = c.table_schema and t.table_name = c.table_name
where c.table_schema='public' and t.table_type='BASE TABLE'
  and c.table_name not in ('_del_audit','_del_subject')
  and lower(c.column_name) in (
    'user_id','owner_user_id','uid','auth_id','profile_id','created_by',
    'account_id','user_uuid','user_uid','member_id','customer_id','owner',
    'email','user_email','contact_email','subscriber_email',
    'phone','mobile','msisdn','phone_number','contact_phone')
group by c.table_name order by c.table_name;
```

### Block 2 — BEFORE (run after seeding the burner, before deletion)

```sql
select public._del_sweep('before');

-- confirm you actually seeded each surface (row_count 0 here = not exercised → an
-- 'after' 0 for that table proves nothing). This is a sanity check, not the gate.
select table_name, column_name, row_count, note
from public._del_audit where phase='before'
order by row_count desc, table_name;
```

### Block 3 — DELETE

Sign in as the burner → `/delete-account` → type `DELETE` → confirm. Expect the "done" screen (`success:true`, HTTP 200). **Do not proceed unless it reports success** — the whole point is to catch a success that isn't true.

### Block 4 — AFTER (run once the "done" screen shows)

```sql
select public._del_sweep('after');
```

### Block 5 — THE GATE (centerpiece): pass ⇔ zero rows returned

```sql
-- ANY row returned = FAIL. Survivors (>0) AND un-provable checks (-1) both surface.
-- No eyeballing, no count comparison: empty result set is the ONLY pass.
select table_name, column_name, match_value, row_count, note
from public._del_audit
where phase='after' and row_count <> 0
order by row_count desc, table_name;
```

Plus the identity record itself — **different schema (`auth`), so the sweep can't see it**; this must also return zero:

```sql
-- auth user gone? must return ZERO rows.
select id, email, phone
from auth.users
where id::text = (select user_id from public._del_subject)
   or lower(email) = lower((select email from public._del_subject))
   or (nullif((select phone from public._del_subject),'') is not null
       and regexp_replace(coalesce(phone,''),'\D','','g')
         = regexp_replace((select phone from public._del_subject),'\D','','g'));
```

And **Storage** — a table-list route's classic blind spot (uploaded statement PDFs), also outside `public`:

```sql
-- any per-user objects left in Storage? must return ZERO rows.
select bucket_id, name, owner, created_at
from storage.objects
where owner::text = (select user_id from public._del_subject)
   or name ilike '%'||(select user_id from public._del_subject)||'%';
```

### Block 6 — optional side-by-side (for the eye only; not the gate)

```sql
select coalesce(b.table_name,a.table_name) as table_name,
       coalesce(b.column_name,a.column_name) as column_name,
       b.row_count as before_count, a.row_count as after_count
from (select * from public._del_audit where phase='before') b
full join (select * from public._del_audit where phase='after') a
  on a.table_name=b.table_name and a.column_name=b.column_name
order by after_count desc nulls last, before_count desc nulls last;
```

### Block 7 — cleanup

```sql
drop function if exists public._del_sweep(text);
drop table if exists public._del_audit;
drop table if exists public._del_subject;
```

---

## The RECONCILED LIST — the gap that must close before the route merges

Static half (no burner needed): **every user-identifying public table the live schema exposes, minus every table the route deletes from.** Run any time.

```sql
with route_tables(table_name) as (
  values
    ('aa_consents'),('applications'),('hook_events'),('manual_cards'),
    ('personal_cards'),('personal_entitlements'),('redemptions'),
    ('statement_imports'),('subscriptions'),('user_points'),('user_profiles'),
    ('linked_cards'),('subscription_events'),('alert_subscriptions'),
    ('personal_card_transactions')
),
discovered as (
  select c.table_name,
         string_agg(distinct c.column_name, ', ' order by c.column_name) as id_columns
  from information_schema.columns c
  join information_schema.tables t
    on t.table_schema=c.table_schema and t.table_name=c.table_name
  where c.table_schema='public' and t.table_type='BASE TABLE'
    and c.table_name not in ('_del_audit','_del_subject')
    and lower(c.column_name) in (
      'user_id','owner_user_id','uid','auth_id','profile_id','created_by',
      'account_id','user_uuid','user_uid','member_id','customer_id','owner',
      'email','user_email','contact_email','subscriber_email',
      'phone','mobile','msisdn','phone_number','contact_phone')
  group by c.table_name
)
select d.table_name, d.id_columns
from discovered d
left join route_tables r on r.table_name = d.table_name
where r.table_name is null
order by d.table_name;
```

**Reading it:**
- **Empty result → the route covers every user-identifying public table by name.** Its `USER_KEYED` list is complete against the live schema; the fail-loud is no longer blind.
- **Non-empty → each row is a candidate PII survivor.** Triage every one, guilty until proven anonymous:
  - **Real user data** → add `{ table, col }` to the route's `USER_KEYED` (mind the owning column — e.g. `personal_cards` uses `owner_user_id`) **before** it merges.
  - **Genuinely non-personal** (e.g. `created_by` = an admin/system id, `account_id` = an org id, a merchant `email`) → record why in `store/data-safety.md`'s "not deleted" section so the exclusion is documented, not silent.

This delta is exactly the item-2 completeness risk, mechanized: **the route's fail-loud re-checks its own list, so it cannot detect a table the list omits — this query is the independent oracle that can.**

---

## Caveats you should hold while running this

- **Discovery is only as wide as the column-name list.** A user link named unconventionally (`holder`, `applicant_uuid`, `beneficiary_id`) slips both the sweep and the reconciled list. Backstop for the paranoid pass — dump *all* columns of *all* public tables and skim by eye once:
  ```sql
  select table_name, column_name, data_type
  from information_schema.columns
  where table_schema='public' order by table_name, ordinal_position;
  ```
- **False positives are fine, false negatives aren't.** Over-flagging (a merchant `email`, a `created_by` that's an admin) just costs you a triage line. That's the correct bias for a deletion oracle.
- **Run order matters:** BEFORE after seeding, AFTER only after the "done" screen. And run the **reconciled list before anything is user-facing** (API-first phase), so the table list is fixed before the page can exist in prod.
- **`auth` and `storage` are separate schemas** — that's why they get their own explicit checks in Block 5. The `public`-only sweep would miss both, and Storage (raw statement PDFs) is precisely the kind of PII a hardcoded-table route forgets.

---

## Burner end-to-end test — seeding checklist

1. **Burner account** on the target env: real signup (burner email/phone).
2. **Seed every surface** so each table has something to lose: finish onboarding (`user_profiles`), add a manual card (`manual_cards`), upload a statement (`statement_imports`, maybe `personal_cards`/`_transactions`), subscribe to an email alert **using the account email** (`alert_subscriptions`), start a subscription if feasible (`subscriptions`/`subscription_events`/`personal_entitlements`), click an apply link (`applications`), AA-link if possible (`aa_consents`/`linked_cards`), plus `user_points`/`redemptions` if reachable. **Also** subscribe a second alert with a **different** email — to test the known limitation for real.
3. Block 2 (BEFORE) → confirm ≥1 row where seeded.
4. Block 3 (DELETE) → "done" screen.
5. Block 5 (GATE) → must be empty; plus auth.users and storage.objects checks → zero.
6. **Login is dead** — attempt sign-in with the deleted account → must fail.
7. **Known-gap check** — Block 5 (or a direct query) for the *second* email in `alert_subscriptions` → confirm whether it survives; decide disclosure vs support-sweep with evidence.

---

## Resume pointer

Next action when picking this back up: get the Play Console answer (declared? → urgency), then **API-first** per Order of operations — cherry-pick `0c5e02ba`, run the reconciled-list query, close any gap in `route.ts`'s `USER_KEYED`, merge, then run this harness against a burner. Page and link follow, in that order.
