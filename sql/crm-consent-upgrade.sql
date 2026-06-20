-- ============================================================
-- Pittahaya CRM — Proof-of-consent upgrade (LOPDP / PIPEDA)
-- Run ONCE in Supabase → SQL Editor. Safe to re-run.
-- Records, per lead, that the person ticked "I accept the Privacy
-- Policy & Terms" and WHEN. The site works without this (the consent
-- is also recorded in the admin email), but running it stores the
-- proof in the CRM/database too.
-- ============================================================

alter table public.leads
  add column if not exists privacy_consent boolean     default false,
  add column if not exists consent_at      timestamptz;

create index if not exists leads_privacy_consent_idx on public.leads (privacy_consent);
