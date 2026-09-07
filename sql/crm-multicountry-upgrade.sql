-- ============================================================
-- Pittahaya CRM — Multi-país (Ecuador 🇪🇨 + Canadá 🇨🇦) + Tax-ready
-- Run ONCE in Supabase → SQL Editor. Safe to re-run (IF NOT EXISTS).
-- ------------------------------------------------------------
-- Objetivo: que cada venta y cada gasto quede marcado con su PAÍS,
-- su MONEDA real y (cuando aplique) su IMPUESTO — para que el
-- contador de cada país descargue un solo reporte y declare.
--
-- Hoy Pittahaya es "pequeño proveedor" (bajo el umbral en los dos
-- países), así que el impuesto por defecto es 0. Estos campos dejan
-- el sistema LISTO para activarlo con un clic cuando toque registrar.
-- ============================================================

-- ── Leads / ventas ───────────────────────────────────────────
alter table public.leads
  add column if not exists country     text          default 'ec',   -- 'ec' (Ecuador) | 'ca' (Canadá)
  add column if not exists tax_amount  numeric(12,2) default 0,       -- impuesto de venta cobrado (IVA / GST-HST). 0 = pequeño proveedor
  add column if not exists withholding numeric(12,2) default 0;       -- retención en la fuente (sobre todo Ecuador)

-- ── Gastos ───────────────────────────────────────────────────
alter table public.expenses
  add column if not exists country    text          default 'ec',    -- 'ec' | 'ca'
  add column if not exists tax_amount numeric(12,2) default 0;        -- impuesto pagado recuperable (IVA crédito / ITC)

-- ── Índices para reportes por país ──────────────────────────
create index if not exists leads_country_idx    on public.leads (country);
create index if not exists expenses_country_idx on public.expenses (country);

-- ── Backfill: la moneda define el país en registros antiguos ──
-- (USD → Ecuador por defecto; CAD → Canadá.) Ajusta a mano si hace falta.
update public.leads    set country = 'ca' where country is null and upper(coalesce(currency,'')) = 'CAD';
update public.leads    set country = 'ec' where country is null;
update public.expenses set country = 'ca' where country is null and upper(coalesce(currency,'')) = 'CAD';
update public.expenses set country = 'ec' where country is null;

-- ── Configuración fiscal (para activar IVA / GST-HST con un botón) ──
-- Guarda, por país, si ya te registraste para cobrar impuesto y desde
-- cuándo. Mientras "registered" sea false, el CRM te trata como pequeño
-- proveedor (impuesto 0). El botón del Radar fiscal cambia esto.
create table if not exists public.crm_settings (
  key        text primary key,
  value      jsonb       not null default '{}',
  updated_at timestamptz  default now()
);
alter table public.crm_settings enable row level security;  -- solo la service key del CRM entra

