-- Run this in the Supabase SQL Editor to set up the database schema

-- Profiles table (auto-created for each auth user)
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  strava_athlete_id bigint,
  strava_tokens jsonb,
  created_at timestamptz default now()
);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, new.raw_user_meta_data ->> 'display_name');
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Training plans
create table if not exists plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  name text not null,
  status text not null default 'draft' check (status in ('draft', 'in_progress', 'completed')),
  goal text not null,
  race_type text not null default 'flat' check (race_type in ('flat', 'trail')),
  target_elevation_m integer,
  current_weekly_km numeric not null,
  race_date date not null,
  volume_increase_pct numeric not null default 10,
  options jsonb not null default '{}',
  weeks jsonb not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists plans_user_id_idx on plans(user_id);

-- Progress tracking
create table if not exists progress (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references plans(id) on delete cascade,
  day_key text not null,
  completed boolean not null default false,
  rating smallint not null default 0 check (rating between 0 and 3),
  note text not null default '',
  strava_url text not null default '',
  strava_activity_id bigint,
  actual_km numeric,
  description text,
  is_extra boolean not null default false,
  deleted boolean not null default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(plan_id, day_key)
);

create index if not exists progress_plan_id_idx on progress(plan_id);

-- Example plans (read-only templates)
create table if not exists example_plans (
  id text primary key,
  name text not null,
  description text not null,
  goal text not null,
  weeks jsonb not null
);

-- Row Level Security
alter table profiles enable row level security;
alter table plans enable row level security;
alter table progress enable row level security;
alter table example_plans enable row level security;

-- Profiles: users can read/update their own
create policy "Users can view own profile" on profiles
  for select using (auth.uid() = id);
create policy "Users can update own profile" on profiles
  for update using (auth.uid() = id);

-- Plans: users can CRUD their own
create policy "Users can view own plans" on plans
  for select using (auth.uid() = user_id);
create policy "Users can create plans" on plans
  for insert with check (auth.uid() = user_id);
create policy "Users can update own plans" on plans
  for update using (auth.uid() = user_id);
create policy "Users can delete own plans" on plans
  for delete using (auth.uid() = user_id);

-- Progress: users can CRUD progress on their own plans
create policy "Users can view own progress" on progress
  for select using (
    exists (select 1 from plans where plans.id = progress.plan_id and plans.user_id = auth.uid())
  );
create policy "Users can create progress" on progress
  for insert with check (
    exists (select 1 from plans where plans.id = progress.plan_id and plans.user_id = auth.uid())
  );
create policy "Users can update own progress" on progress
  for update using (
    exists (select 1 from plans where plans.id = progress.plan_id and plans.user_id = auth.uid())
  );
create policy "Users can delete own progress" on progress
  for delete using (
    exists (select 1 from plans where plans.id = progress.plan_id and plans.user_id = auth.uid())
  );

-- Example plans: readable by all authenticated users
create policy "Anyone can read example plans" on example_plans
  for select using (true);
