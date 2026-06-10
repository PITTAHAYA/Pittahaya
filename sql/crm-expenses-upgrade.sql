-- ============================================================
-- Pittahaya CRM — Expenses & Profit (P&L) upgrade
-- Run ONCE in Supabase → SQL Editor (after the finance upgrade).
-- Safe to re-run.
-- ============================================================

create table if not exists public.expenses (
  id          uuid primary key default gen_random_uuid(),
  label       text not null,
  category    text default 'otros',        -- software | marketing | contratistas | oficina | impuestos | otros
  cost_type   text default 'operating',    -- 'direct' (costo de proyecto) | 'operating' (gasto operativo)
  amount      numeric(12,2) not null default 0,
  currency    text default 'USD',
  expense_date date default current_date,
  recurring   boolean default false,       -- gasto mensual recurrente (suscripciones, etc.)
  created_at  timestamptz default now()
);

create index if not exists expenses_date_idx on public.expenses (expense_date desc);
create index if not exists expenses_type_idx on public.expenses (cost_type);

-- Lock it down: only the CRM service key (which bypasses RLS) can touch it.
-- The public anon key gets no access.
alter table public.expenses enable row level security;
