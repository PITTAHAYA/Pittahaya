# Pittahaya — AI Auto-Reply Agent · Build Plan

Goal: an AI agent that reads each incoming lead and produces a **personalized**
reply — first as a *draft you approve*, later (once you trust it) fully automatic.
Bonus: it becomes living proof of the exact AI automation you sell.

Your current stack already does the boring parts:
- Lead form → `/api/submit-lead` → saves to **Supabase** (`leads` table) + emails you (**Resend**).
- The customer now also gets an instant branded confirmation (just added).

The AI agent is a layer **on top** of that. Build it in phases — never skip Phase 1.

---

## Phase 0 — Decide the mode (1 minute)
- **Draft mode (START HERE):** AI writes the reply, a human clicks send. Zero risk of an
  embarrassing or wrong auto-send while you're still calibrating the voice.
- **Auto-send mode (LATER):** AI sends on its own. Only flip this after ~20–30 drafts
  you'd have sent almost unchanged.

---

## Phase 1 — AI drafts, you approve (recommended first build)

**1. Get an LLM key**
- Anthropic (Claude) or OpenAI. Add it to Vercel as `LLM_API_KEY` (env var, never in code).

**2. Add a column to store the draft**
- In Supabase `leads`, add a text column: `ai_draft` (and optionally `ai_draft_at`).

**3. New serverless function `/api/ai-reply.js`**
- Trigger options (pick one):
  - **Simplest:** call it from inside `submit-lead.js` right after the lead is saved
    (fire-and-forget, wrapped in try/catch so it never breaks the save).
  - **Cleaner:** a **Supabase Database Webhook** on `INSERT` into `leads` → calls this function.
- What it does:
  1. Receives the lead (name, email, company, service, message, source_page, language).
  2. Calls the LLM with the **system prompt** below + the lead details.
  3. Writes the result to `leads.ai_draft` for that lead id.

**4. Show the draft in your CRM**
- In `crm/lead.html`, add a "Suggested reply (AI)" box that displays `ai_draft` with:
  - **Edit & Send** → opens Gmail compose prefilled (`https://mail.google.com/mail/?view=cm&to=...&su=...&body=...`)
    OR sends via Resend with `reply_to` = your Gmail.
  - **Regenerate** → re-runs `/api/ai-reply` for that lead.

That's a complete, safe loop: lead comes in → AI drafts → you review in the CRM → one click sends.

---

## Phase 2 — Reply *inside* the Gmail thread (optional, more setup)
If you want replies to come **from your actual Gmail** (same thread, not a noreply address):
1. Google Cloud Console → enable **Gmail API**.
2. Create **OAuth credentials**, authorize the company Gmail once, store the **refresh token**
   in Vercel (`GMAIL_CLIENT_ID`, `GMAIL_CLIENT_SECRET`, `GMAIL_REFRESH_TOKEN`).
3. In `/api/ai-reply.js`, use the Gmail API to **create a draft** (`users.drafts.create`) or
   **send** (`users.messages.send`) as the company inbox.
- Simpler alternative if this feels heavy: keep sending via **Resend** with
  `reply_to` = your Gmail. The customer still replies into your inbox; it just doesn't
  thread perfectly. 90% of the value, 10% of the setup.

---

## Phase 3 — Go autonomous (only when calibrated)
- Flip a flag `AI_AUTOSEND=true`. The function sends the draft directly instead of saving it.
- Keep **every** sent reply logged (a `lead_ai_replies` table) so you can audit.
- Add a kill switch (env var) and a daily cap.

---

## The system prompt (the brain — tune this)
> You are Pittahaya's assistant replying to a new lead by email. Pittahaya builds premium,
> custom websites and AI automation (chatbots & agents) for businesses in Ecuador and beyond.
> Write a short, warm, professional reply IN THE LEAD'S LANGUAGE (Spanish or English).
> Rules:
> - Greet them by first name. Reference what they asked about specifically.
> - NEVER invent prices or promise exact timelines. If they ask price, explain it depends on
>   scope and invite them to the free diagnostic / a short call.
> - One clear next step (book a call or reply with details). No hard selling.
> - 120 words max. Sound like a real person, not a corporate bot. Sign as "Pittahaya".
> Output ONLY the email body.

Feed it the lead fields + the message. That's it.

---

## Guardrails (do not skip)
- **Human-in-the-loop first** (Phase 1) — never auto-send untested.
- **No prices / no false promises** — enforced in the prompt; review drafts early.
- **Language match** — detect from `source_page` (`/en/` = English) or ask the model to detect.
- **Logging + cost cap** — store every draft/reply; set a monthly LLM budget.
- **Privacy** — only send lead data to your LLM provider; keep keys server-side only.

---

## Why this is worth it
You **sell** AI automation. When a prospect gets a sharp, instant, personalized reply, you can
say: *"That assistant that answered you? That's the exact automation we'll build into your
business."* The site stops describing the service and starts **demonstrating** it.

**Suggested order:** ship the confirmation email (done) → Phase 1 draft mode → use it for a few
weeks → Phase 2 Gmail threading → Phase 3 autonomous. Tell me when you want to start Phase 1 and
I'll build `/api/ai-reply.js` + the CRM draft box.
