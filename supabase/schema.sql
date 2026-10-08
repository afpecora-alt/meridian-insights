-- Run once in the Supabase SQL editor.
create table if not exists public.snapshots (
  id text primary key,
  name text not null,
  uploaded_at timestamptz not null,
  deals jsonb not null,
  created_at timestamptz not null default now()
);

-- RLS on with no policies: only the server (service role key) can read or
-- write, so snapshots are reachable only through the password-protected app.
alter table public.snapshots enable row level security;
