-- CreditIQ backend-only, issuer-sourced merchant/cart exact quotes for AskGogo.
-- This migration does not generate offers. Only trusted issuer ingestion with a
-- signed issuer contract may populate records; no customer/public write policy.
begin;
set local lock_timeout='5s';
create table if not exists public.verified_issuer_merchant_quotes(
 id uuid primary key default gen_random_uuid(),
 user_link_id text not null,
 cart_sha256 text not null check(cart_sha256 ~ '^[a-f0-9]{64}$'),
 provider text not null check(provider in('swiggy','zepto')),
 currency text not null check(currency='INR'),
 total_paise bigint not null check(total_paise>0 and total_paise<=5000000),
 card_alias text not null,
 offer_id text not null,
 evidence_id text not null,
 source text not null check(source='issuer_authoritative_api'),
 verified_at timestamptz not null,
 expires_at timestamptz not null,
 eligible boolean not null,
 estimated_benefit_paise bigint not null check(estimated_benefit_paise>=0 and estimated_benefit_paise<=5000000),
 merchant_fee_paise bigint not null check(merchant_fee_paise>=0 and merchant_fee_paise<=5000000),
 terms_url text,
 created_at timestamptz not null default now(),
 unique(user_link_id,cart_sha256,provider,offer_id,evidence_id),
 check(expires_at>verified_at)
);
create index if not exists verified_issuer_merchant_quotes_lookup
 on public.verified_issuer_merchant_quotes(user_link_id,cart_sha256,provider,expires_at desc);
alter table public.verified_issuer_merchant_quotes enable row level security;
revoke all on public.verified_issuer_merchant_quotes from public,anon,authenticated;
grant select,insert on public.verified_issuer_merchant_quotes to service_role;
create or replace function public.reject_verified_issuer_merchant_quote_mutation() returns trigger
language plpgsql set search_path='' as $$
begin raise exception 'issuer merchant offers are immutable'; end
$$;
drop trigger if exists verified_issuer_merchant_quotes_immutable on public.verified_issuer_merchant_quotes;
create trigger verified_issuer_merchant_quotes_immutable before update or delete
 on public.verified_issuer_merchant_quotes for each row
 execute function public.reject_verified_issuer_merchant_quote_mutation();
comment on table public.verified_issuer_merchant_quotes is
 'Append-only issuer verified cashback evidence; no card PAN, token, UPI PIN or user-authenticated writes.';
commit;
