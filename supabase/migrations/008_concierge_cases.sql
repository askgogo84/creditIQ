-- CreditIQ Concierge — Personal/HNI case store.
-- Corporate Concierge remains in the separate creditiq-business datastore.
--
-- SECURITY:
--   * direct authenticated clients may SELECT only their own cases/events;
--   * no direct INSERT/UPDATE/DELETE policy is granted to clients;
--   * Vercel API routes authenticate the bearer token, then call service-role-only
--     RPCs with the VERIFIED caller id;
--   * user approval/cancel is an atomic status transition + audit event.

create table if not exists concierge_cases (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null,
  context text not null check (context in ('PERSONAL','HNI')),
  source_type text not null check (source_type in ('FLIGHT','HOTEL')),
  source_ref text not null,
  title text not null,

  -- Client request snapshots are evidence of what the user selected, NOT verified
  -- financial truth. A future operator step writes verified_redemption_snapshot.
  selection jsonb not null default '{}'::jsonb,
  redemption_snapshot jsonb not null default '{}'::jsonb,
  source_snapshot jsonb not null default '{}'::jsonb,
  snapshot_trust text not null default 'CLIENT_REQUEST'
    check (snapshot_trust in ('CLIENT_REQUEST','SERVER_VERIFIED')),

  expected_cash_minor bigint,
  currency text not null default 'INR' check (currency ~ '^[A-Z]{3}$'),
  contact_channel text not null default 'APP'
    check (contact_channel in ('APP','WHATSAPP','BOTH')),
  notes text,

  status text not null default 'REVIEWING' check (status in (
    'REVIEWING','OPTION_CONFIRMED','AWAITING_USER_APPROVAL','TRANSFER_APPROVED',
    'BOOKING_IN_PROGRESS','BOOKED','RECONCILED','NEEDS_INFORMATION',
    'PRICE_CHANGED','AWARD_UNAVAILABLE','CANCELLED','FAILED'
  )),
  approval_state text not null default 'NOT_REQUESTED'
    check (approval_state in ('NOT_REQUESTED','REQUESTED','APPROVED','DECLINED','CANCELLED')),
  approval_requested_at timestamptz,
  approved_at timestamptz,
  cancelled_at timestamptz,

  operator_verified_at timestamptz,
  verified_redemption_snapshot jsonb,
  booking_reference text,
  reconciliation jsonb,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_concierge_cases_user_created
  on concierge_cases (user_id, created_at desc);
create index if not exists idx_concierge_cases_user_status
  on concierge_cases (user_id, status);

create table if not exists concierge_case_events (
  id uuid primary key default uuid_generate_v4(),
  case_id uuid not null references concierge_cases(id) on delete cascade,
  actor_type text not null check (actor_type in ('USER','OPS','SYSTEM')),
  actor_id text,
  event_type text not null,
  from_status text,
  to_status text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_concierge_case_events_case_created
  on concierge_case_events (case_id, created_at asc);

alter table concierge_cases enable row level security;
alter table concierge_case_events enable row level security;

-- Read-only client visibility. All mutations go through authenticated API routes.
drop policy if exists "users read own concierge cases" on concierge_cases;
create policy "users read own concierge cases" on concierge_cases
  for select using (auth.uid() = user_id);

drop policy if exists "users read own concierge events" on concierge_case_events;
create policy "users read own concierge events" on concierge_case_events
  for select using (
    exists (
      select 1 from concierge_cases c
      where c.id = concierge_case_events.case_id
        and c.user_id = auth.uid()
    )
  );

-- Atomic create + first audit event. Client financial fields remain CLIENT_REQUEST.
create or replace function concierge_create_case(
  p_user_id uuid,
  p_context text,
  p_source_type text,
  p_source_ref text,
  p_title text,
  p_selection jsonb,
  p_redemption_snapshot jsonb,
  p_source_snapshot jsonb,
  p_expected_cash_minor bigint,
  p_currency text,
  p_contact_channel text,
  p_notes text
)
returns setof concierge_cases
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  insert into concierge_cases (
    user_id, context, source_type, source_ref, title,
    selection, redemption_snapshot, source_snapshot,
    expected_cash_minor, currency, contact_channel, notes,
    snapshot_trust, status, approval_state
  ) values (
    p_user_id, p_context, p_source_type, p_source_ref, p_title,
    coalesce(p_selection, '{}'::jsonb),
    coalesce(p_redemption_snapshot, '{}'::jsonb),
    coalesce(p_source_snapshot, '{}'::jsonb),
    p_expected_cash_minor, p_currency, p_contact_channel, p_notes,
    'CLIENT_REQUEST', 'REVIEWING', 'NOT_REQUESTED'
  ) returning id into v_id;

  insert into concierge_case_events (
    case_id, actor_type, actor_id, event_type, from_status, to_status, payload
  ) values (
    v_id, 'USER', p_user_id::text, 'CASE_CREATED', null, 'REVIEWING',
    jsonb_build_object('source_type', p_source_type, 'source_ref', p_source_ref)
  );

  return query select * from concierge_cases where id = v_id;
end;
$$;

-- Atomic user-owned state transition. The function rechecks ownership even though
-- the API route already authenticated/scoped the case, closing the IDOR boundary
-- at both application and database layers.
create or replace function concierge_apply_user_action(
  p_user_id uuid,
  p_case_id uuid,
  p_action text
)
returns setof concierge_cases
language plpgsql
security definer
set search_path = public
as $$
declare
  v_case concierge_cases%rowtype;
  v_next text;
  v_now timestamptz := now();
begin
  select * into v_case
  from concierge_cases
  where id = p_case_id and user_id = p_user_id
  for update;

  if not found then
    return;
  end if;

  if p_action = 'APPROVE' and v_case.status = 'AWAITING_USER_APPROVAL' then
    v_next := 'TRANSFER_APPROVED';
  elsif p_action = 'CANCEL' and v_case.status in (
    'REVIEWING','OPTION_CONFIRMED','AWAITING_USER_APPROVAL',
    'NEEDS_INFORMATION','PRICE_CHANGED','AWARD_UNAVAILABLE'
  ) then
    v_next := 'CANCELLED';
  else
    return;
  end if;

  update concierge_cases
  set
    status = v_next,
    approval_state = case
      when p_action = 'APPROVE' then 'APPROVED'
      when p_action = 'CANCEL' then 'CANCELLED'
      else approval_state
    end,
    approved_at = case when p_action = 'APPROVE' then v_now else approved_at end,
    cancelled_at = case when p_action = 'CANCEL' then v_now else cancelled_at end,
    updated_at = v_now
  where id = p_case_id and user_id = p_user_id;

  insert into concierge_case_events (
    case_id, actor_type, actor_id, event_type, from_status, to_status, payload
  ) values (
    p_case_id, 'USER', p_user_id::text,
    case when p_action = 'APPROVE' then 'USER_APPROVED' else 'USER_CANCELLED' end,
    v_case.status, v_next, '{}'::jsonb
  );

  return query select * from concierge_cases where id = p_case_id and user_id = p_user_id;
end;
$$;

-- These RPCs must never be callable with anon/authenticated browser credentials.
revoke all on function concierge_create_case(uuid,text,text,text,text,jsonb,jsonb,jsonb,bigint,text,text,text)
  from public, anon, authenticated;
grant execute on function concierge_create_case(uuid,text,text,text,text,jsonb,jsonb,jsonb,bigint,text,text,text)
  to service_role;

revoke all on function concierge_apply_user_action(uuid,uuid,text)
  from public, anon, authenticated;
grant execute on function concierge_apply_user_action(uuid,uuid,text)
  to service_role;
