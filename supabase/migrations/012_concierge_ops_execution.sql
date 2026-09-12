-- Concierge operator execution transitions.
-- Service-role only. Browser/authenticated clients can never call this directly.

create or replace function concierge_apply_ops_action(
  p_case_id uuid,
  p_actor_id text,
  p_action text,
  p_verified_redemption_snapshot jsonb default null,
  p_booking_reference text default null,
  p_reconciliation jsonb default null,
  p_payload jsonb default '{}'::jsonb
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
  select * into v_case from concierge_cases where id = p_case_id for update;
  if not found then return; end if;

  if p_action = 'CONFIRM_OPTION' and v_case.status in ('REVIEWING','PRICE_CHANGED','NEEDS_INFORMATION') then
    if p_verified_redemption_snapshot is null then return; end if;
    v_next := 'OPTION_CONFIRMED';
  elsif p_action = 'REQUEST_APPROVAL' and v_case.status = 'OPTION_CONFIRMED' then
    v_next := 'AWAITING_USER_APPROVAL';
  elsif p_action = 'START_BOOKING' and v_case.status = 'TRANSFER_APPROVED' then
    v_next := 'BOOKING_IN_PROGRESS';
  elsif p_action = 'MARK_BOOKED' and v_case.status = 'BOOKING_IN_PROGRESS' then
    if coalesce(trim(p_booking_reference), '') = '' then return; end if;
    v_next := 'BOOKED';
  elsif p_action = 'RECONCILE' and v_case.status = 'BOOKED' then
    if p_reconciliation is null then return; end if;
    v_next := 'RECONCILED';
  elsif p_action = 'NEEDS_INFORMATION' and v_case.status in ('REVIEWING','OPTION_CONFIRMED') then
    v_next := 'NEEDS_INFORMATION';
  elsif p_action = 'PRICE_CHANGED' and v_case.status in ('REVIEWING','OPTION_CONFIRMED','AWAITING_USER_APPROVAL') then
    v_next := 'PRICE_CHANGED';
  elsif p_action = 'AWARD_UNAVAILABLE' and v_case.status in ('REVIEWING','OPTION_CONFIRMED','AWAITING_USER_APPROVAL') then
    v_next := 'AWARD_UNAVAILABLE';
  elsif p_action = 'FAIL' and v_case.status in ('TRANSFER_APPROVED','BOOKING_IN_PROGRESS') then
    v_next := 'FAILED';
  else
    return;
  end if;

  update concierge_cases set
    status = v_next,
    snapshot_trust = case when p_action = 'CONFIRM_OPTION' then 'SERVER_VERIFIED' else snapshot_trust end,
    operator_verified_at = case when p_action = 'CONFIRM_OPTION' then v_now else operator_verified_at end,
    verified_redemption_snapshot = case when p_action = 'CONFIRM_OPTION' then p_verified_redemption_snapshot else verified_redemption_snapshot end,
    approval_state = case when p_action = 'REQUEST_APPROVAL' then 'REQUESTED' else approval_state end,
    approval_requested_at = case when p_action = 'REQUEST_APPROVAL' then v_now else approval_requested_at end,
    booking_reference = case when p_action = 'MARK_BOOKED' then trim(p_booking_reference) else booking_reference end,
    reconciliation = case when p_action = 'RECONCILE' then p_reconciliation else reconciliation end,
    updated_at = v_now
  where id = p_case_id;

  insert into concierge_case_events(case_id, actor_type, actor_id, event_type, from_status, to_status, payload)
  values (p_case_id, 'OPS', nullif(trim(p_actor_id), ''), 'OPS_' || p_action, v_case.status, v_next, coalesce(p_payload, '{}'::jsonb));

  return query select * from concierge_cases where id = p_case_id;
end;
$$;

revoke all on function concierge_apply_ops_action(uuid,text,text,jsonb,text,jsonb,jsonb)
  from public, anon, authenticated;
grant execute on function concierge_apply_ops_action(uuid,text,text,jsonb,text,jsonb,jsonb)
  to service_role;
