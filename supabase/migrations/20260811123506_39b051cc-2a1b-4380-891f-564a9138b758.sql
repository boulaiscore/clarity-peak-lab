-- Provider-neutral subscription metadata while preserving every legacy Paddle row.
alter table public.subscriptions
  add column if not exists provider text not null default 'paddle',
  add column if not exists external_subscription_id text,
  add column if not exists plan_id text;

alter table public.subscriptions
  alter column paddle_subscription_id drop not null,
  alter column paddle_customer_id drop not null;

update public.subscriptions
set external_subscription_id = coalesce(external_subscription_id, paddle_subscription_id),
    plan_id = coalesce(
      plan_id,
      case
        when price_id in ('looma_elite_monthly', 'looma_elite_yearly') then 'pro'
        when price_id in ('looma_pro_monthly', 'looma_pro_yearly') then 'core'
        else 'core'
      end
    )
where provider = 'paddle';

-- Preserve legacy value semantics before new webhooks begin writing the new
-- Core/Pro names: legacy Pro was the middle tier; legacy Elite was the top.
update public.profiles
set subscription_status = case
  when subscription_status in ('premium', 'trialing', 'pro') then 'core'
  when subscription_status = 'elite' then 'pro'
  else subscription_status
end
where subscription_status in ('premium', 'trialing', 'pro', 'elite');

create unique index if not exists subscriptions_provider_external_id_key
  on public.subscriptions(provider, external_subscription_id);

create index if not exists subscriptions_user_provider_idx
  on public.subscriptions(user_id, provider, created_at desc);

create table if not exists public.team_waitlist (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  email text not null,
  company_or_group text,
  seats integer not null check (seats between 2 and 100),
  created_at timestamptz not null default now(),
  unique(email)
);

grant select, insert, update on public.team_waitlist to authenticated;
grant insert on public.team_waitlist to anon;
grant all on public.team_waitlist to service_role;

alter table public.team_waitlist enable row level security;

create policy "Users can join team waitlist"
  on public.team_waitlist for insert
  with check (auth.uid() = user_id or user_id is null);

create policy "Users can view own team waitlist entry"
  on public.team_waitlist for select
  using (auth.uid() = user_id);

create policy "Users can update own team waitlist entry"
  on public.team_waitlist for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);