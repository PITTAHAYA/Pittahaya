-- ============================================================
-- Pittahaya CRM — Contacto: redes sociales
-- Run ONCE in Supabase → SQL Editor. Safe to re-run.
-- (El teléfono ya existe en la tabla; esto agrega "redes sociales".)
-- ============================================================

alter table public.leads
  add column if not exists social text default '';
