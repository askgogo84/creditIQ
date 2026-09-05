-- Generic in-app notifications for Dream Trip, devaluations and future reward events.
create table if not exists user_notifications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null,
  type text not null,
  title text not null,
  body text not null,
  href text,
  severity text not null default 'INFO' check (severity in ('INFO','OPPORTUNITY','WARNING','URGENT')),
  source_type text,
  source_ref text,
  fingerprint text,
  metadata jsonb not null default '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_user_notifications_user_created
  on user_notifications (user_id, created_at desc);
create index if not exists idx_user_notifications_unread
  on user_notifications (user_id, created_at desc) where read_at is null;
create unique index if not exists idx_user_notifications_fingerprint
  on user_notifications (user_id, fingerprint) where fingerprint is not null;

alter table user_notifications enable row level security;
drop policy if exists "users read own notifications" on user_notifications;
create policy "users read own notifications" on user_notifications
  for select using ((select auth.uid()) = user_id);

-- Keep Dream Trip's RLS efficient at scale.
drop policy if exists "users read own travel watches" on travel_watches;
create policy "users read own travel watches" on travel_watches
  for select using ((select auth.uid()) = user_id);
