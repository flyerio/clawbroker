# OpenClaw & ClawBroker AI — Explained

## What is OpenClaw?

**OpenClaw** is an open-source AI agent framework (180k+ GitHub stars, launched late January 2026). It's a runtime platform for building **autonomous AI agents** that take real actions — not just answer questions. Key capabilities:

- **Agent orchestration** — manages skills, memory, and multi-step execution
- **LLM integration** — uses models like Claude for reasoning and decision-making
- **Persistent state** — agents remember context across conversations
- **Extensible skill system** — plug in domain-specific capabilities

OpenClaw is designed for **vertical applications** where developers build industry-specific agents on top of the framework.

## What is ClawBroker AI?

This repository (`clawbroker`) is **ClawBroker AI** — a production SaaS platform built **on top of OpenClaw**, targeting **commercial real estate (CRE) brokers**. It wraps OpenClaw's agent framework in a turnkey product with billing, infrastructure, and a Telegram-based interface.

## Architecture

```
User (Telegram) → Telegram Bot → Fly.io VM (OpenClaw Agent) → Skills (Search, Demographics, etc.)
       ↕                                    ↕
  Web Dashboard (Next.js)  ←→  Supabase DB  ←→  Stripe (Billing)
```

**Stack:** Next.js 16 / React 19 / TypeScript / Supabase / Fly.io / Clerk / Stripe / Telegram Bot API

### Key Components

| Component | Purpose |
|---|---|
| **Bot Pool** | Pre-provisioned Telegram bots assigned to users on signup |
| **Fly.io VMs** | Each user gets an isolated VM running their OpenClaw agent |
| **Web Dashboard** | Onboarding, billing, usage stats, agent configuration |
| **Supabase** | User data, agent state, balances, pricing config |
| **Cron Jobs** | Hourly balance checks, low-balance warnings, auto-suspension |

## What the AI Agent Does for CRE Brokers

- **Property Search** — AI-powered web search for available properties
- **Demographic Analysis** — ESRI data (population, income, housing — 58 data types)
- **Document Extraction** — Process PDFs, Excel, CSV, images to extract deal data
- **Market Monitoring** — Daily alerts for new listings matching criteria
- **Client Memory** — Remembers client profiles and deal history across conversations
- **Chart Generation** — Professional charts from any data
- **Property Analysis** — Survey grids, Google Places integration, research enrichment

## User Onboarding Flow

1. **Sign up** with a business email (personal emails blocked)
2. **Account created** with $50 free credit
3. **Telegram bot assigned** from pool
4. **Fly.io VM started** for the agent
5. **OpenClaw configured** with CRE skills
6. **Telegram paired** via a one-time deep link token (15-min TTL)
7. User starts chatting with their AI broker assistant

## Billing Model

- **$50 free credit** on signup (no card required)
- **Pay-as-you-go** via Stripe top-ups
- Costs split into **LLM costs** (Claude API) and **app feature costs** (demographics, places, etc.)
- Auto-suspend at $0 balance; low-balance warning at $5

## Key Design Decisions

- **One bot per user** — isolated, secure multi-tenancy via separate Fly.io VMs
- **Telegram as primary UI** — mobile-first, zero app install friction
- **Agent pool pattern** — pre-provisioned bots for instant assignment
- **Optimistic locking** — prevents race conditions during bot assignment and pairing
- **Cron-based monitoring** — hourly balance checks with proactive notifications

## Data Model

Key tables in Supabase:

- **`openclaw_agents`** — Bot pool and agent instances (status, bot token, Fly.io refs, pairing state)
- **`user_identity_map`** — Links Clerk auth users to internal app user IDs
- **`usd_balance`** — Per-user financial tracking (budget, LLM spend, app spend, remaining)
- **`pricing_config`** — Dynamic pricing for features

## API Routes

### Onboarding
- `POST /api/onboard/account` — Create user identity mapping
- `POST /api/onboard/assign` — Assign bot from pool
- `POST /api/onboard/start` — Start Fly.io VM
- `POST /api/onboard/configure` — Configure OpenClaw agent with CRE skills

### Operations
- `GET /api/status` — Agent status and Telegram connection state
- `GET /api/balance` — USD balance and spending breakdown
- `POST /api/checkout` — Create Stripe payment link

### Webhooks
- `POST /api/webhooks/telegram` — Receive Telegram messages for pairing
- `POST /api/webhooks/stripe` — Process payment completions
- `POST /api/openclaw-logs` — Receive logs from running agents

### Admin
- `GET /api/admin/tenants` — List all agents with balances
- `GET /api/admin/bot-pool` — Manage bot pool
- `POST /api/admin/suspend-tenant` — Suspend accounts
- `POST /api/admin/activate-tenant` — Manually activate agents
