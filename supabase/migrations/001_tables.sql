-- supabase/migrations/001_tables.sql
--
-- Tabele bazowe: admin_profiles, invite_tokens, submissions.
-- Uruchom w Supabase SQL Editor w kolejności numeracji plików (001, 002, 003...).

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------
-- admin_profiles
-- ---------------------------------------------------------------------
create table public.admin_profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  username text not null unique,
  display_name text not null,
  signature text not null default '',
  is_operator boolean not null default false,
  created_at timestamptz not null default now()
);

create index admin_profiles_username_idx on public.admin_profiles(username);

comment on table public.admin_profiles is
  'Profile adminów i operatora. username jest loginem widocznym w UI (bez emaila).';

-- ---------------------------------------------------------------------
-- invite_tokens
-- ---------------------------------------------------------------------
create table public.invite_tokens (
  id uuid primary key default gen_random_uuid(),
  token text not null unique,
  created_by uuid not null references public.admin_profiles(id),
  expires_at timestamptz not null,
  used_at timestamptz,
  created_admin_id uuid references public.admin_profiles(id),
  created_at timestamptz not null default now()
);

create index invite_tokens_token_idx on public.invite_tokens(token);

comment on table public.invite_tokens is
  'Jednorazowe linki aktywacyjne generowane przez operatora w /master.';

-- ---------------------------------------------------------------------
-- submissions
-- ---------------------------------------------------------------------
create type submission_status as enum ('pending', 'scheduled', 'done');

create table public.submissions (
  id uuid primary key default gen_random_uuid(),
  image_path text not null,
  sender_nickname text not null,
  channel_link text,
  status submission_status not null default 'pending',
  comment_body text not null default '',
  handled_by uuid references public.admin_profiles(id),
  scheduled_for timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index submissions_status_idx on public.submissions(status);
create index submissions_scheduled_for_idx on public.submissions(scheduled_for);

comment on table public.submissions is
  'Zgłoszone wpadki. comment_body przechowuje surowy tekst z placeholderami
   (%sender%, %channel_link%) - podstawianie wartości dzieje się w warstwie
   renderowania, nigdy nie jest zapisywane na trwałe.';

-- ---------------------------------------------------------------------
-- updated_at trigger dla submissions
-- ---------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger submissions_set_updated_at
  before update on public.submissions
  for each row execute function public.set_updated_at();
