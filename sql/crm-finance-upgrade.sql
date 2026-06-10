-- ============================================================
-- Pittahaya CRM — Finance & Progress upgrade
-- Run ONCE in Supabase → SQL Editor (before deploying the new code).
-- Safe to re-run: every statement uses IF NOT EXISTS.
-- ============================================================

alter table public.leads
  add column if not exists deal_value     numeric(12,2) default 0,   -- quoted / agreed amount
  add column if not exists amount_paid    numeric(12,2) default 0,   -- how much they've paid so far
  add column if not exists currency       text          default 'USD',
  add column if not exists payment_status text          default 'unpaid',  -- unpaid | deposit | partial | paid
  add column if not exists project_stage  text          default '',         -- '' | diagnosis | design | review | launch | delivered
  add column if not exists next_followup  date;

create index if not exists leads_deal_value_idx    on public.leads (deal_value);
create index if not exists leads_payment_status_idx on public.leads (payment_status);
create index if not exists leads_project_stage_idx  on public.leads (project_stage);

-- Optional: a lightweight payments log if you ever want itemized payments.
-- (Not required by the CRM UI — uncomment only if you want it.)
-- create table if not exists public.lead_payments (
--   id uuid primary key default gen_random_uuid(),
--   lead_id uuid references public.leads(id) on delete cascade,
--   amount numeric(12,2) not null,
--   note text,
--   paid_at timestamptz default now()
-- );
