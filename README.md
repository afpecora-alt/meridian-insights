# Meridian Insights

Password-protected sales insights for Meridian deal exports. Built with Next.js (App Router) and Tailwind CSS.

## Flow

1. **/login** – enter the team password, set with the `APP_PASSWORD` environment variable.
2. **/upload** – drop a deals CSV. It is parsed and kept in the browser only.
3. **/insights** – revenue over time, rep performance, time to close, open pipeline, revenue mix, win rate by competitor, and a customers table.
4. **Share** – saves a snapshot of the uploaded data to Supabase and returns a `/share/<id>` link. Viewers need the team password; the snapshot never changes after it is created.

## Run locally

```bash
cp .env.example .env.local   # then set APP_PASSWORD
npm install
npm run dev
```

Without Supabase credentials, `npm run dev` stores shared snapshots in `.data/` so the share flow can be tried locally. Production builds require Supabase.

## Supabase setup

1. Create a Supabase project and run [`supabase/schema.sql`](supabase/schema.sql) in the SQL editor.
2. Copy `.env.example` to `.env.local` and fill in `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` (Project Settings → API). The service role key is only used on the server.

## Deploy to Vercel

Push the repo to GitHub, import it in Vercel, and set these environment variables:

| Variable | Purpose |
| --- | --- |
| `APP_PASSWORD` | Login password |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-side key for the `snapshots` table |

## CSV format

Required columns (any order): `deal_id, company_name, industry, rep_name, lead_source, product_line, deal_stage, deal_value, created_date, close_date, days_in_stage, last_activity_days_ago, probability_pct, competitor_mentioned, num_stakeholders, next_action`.

Dates may be `m/d/yyyy` or `yyyy-mm-dd`. Deals count as revenue when `deal_stage` is `Closed Won`; `Closed Lost` deals count against win rate; everything else is open pipeline.
