-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================================================
-- 1. USER PROFILES
-- ============================================================================
create table public.user_profiles (
    id uuid references auth.users(id) on delete cascade primary key,
    display_name text,
    age integer,
    height_cm numeric,
    weight_kg numeric,
    goals text[],
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS)
alter table public.user_profiles enable row level security;

-- RLS Policies
create policy "Users can view own profile" 
    on public.user_profiles for select 
    using (auth.uid() = id);

create policy "Users can update own profile" 
    on public.user_profiles for update 
    using (auth.uid() = id);

create policy "Users can insert own profile" 
    on public.user_profiles for insert 
    with check (auth.uid() = id);


-- ============================================================================
-- 2. HEALTH METRICS (Automated / Wearable Data)
-- ============================================================================
create table public.health_metrics (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references auth.users(id) on delete cascade not null,
    type text not null, -- e.g., 'heartRate', 'steps', 'hrv', 'sleepStage'
    value numeric not null,
    unit text,
    timestamp timestamp with time zone not null,
    source text, -- e.g., 'appleHealth', 'googleHealth', 'manual'
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Indexes for fast querying by user and time
create index idx_health_metrics_user_type_time on public.health_metrics (user_id, type, timestamp);

-- Enable Row Level Security (RLS)
alter table public.health_metrics enable row level security;

-- RLS Policies
create policy "Users can view own metrics" 
    on public.health_metrics for select 
    using (auth.uid() = user_id);

create policy "Users can insert own metrics" 
    on public.health_metrics for insert 
    with check (auth.uid() = user_id);

create policy "Users can update own metrics" 
    on public.health_metrics for update 
    using (auth.uid() = user_id);

create policy "Users can delete own metrics" 
    on public.health_metrics for delete 
    using (auth.uid() = user_id);


-- ============================================================================
-- 3. MANUAL LOGS (Symptoms, BP, Mood, Notes)
-- ============================================================================
create table public.manual_logs (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references auth.users(id) on delete cascade not null,
    category text not null, -- e.g., 'symptom', 'bp', 'weight', 'mood', 'sleepQuality', 'note'
    value text not null,
    details text,
    timestamp timestamp with time zone not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Indexes for fast querying by user, category, and time
create index idx_manual_logs_user_category_time on public.manual_logs (user_id, category, timestamp);

-- Enable Row Level Security (RLS)
alter table public.manual_logs enable row level security;

-- RLS Policies
create policy "Users can view own logs" 
    on public.manual_logs for select 
    using (auth.uid() = user_id);

create policy "Users can insert own logs" 
    on public.manual_logs for insert 
    with check (auth.uid() = user_id);

create policy "Users can update own logs" 
    on public.manual_logs for update 
    using (auth.uid() = user_id);

create policy "Users can delete own logs" 
    on public.manual_logs for delete 
    using (auth.uid() = user_id);


-- ============================================================================
-- 4. AI INSIGHTS CACHE
-- ============================================================================
create table public.ai_insights (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references auth.users(id) on delete cascade not null,
    kind text not null, -- e.g., 'daily', 'weekly'
    date date not null,
    payload jsonb not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Indexes for fast retrieval of insights by user and date
create index idx_ai_insights_user_kind_date on public.ai_insights (user_id, kind, date);

-- Enable Row Level Security (RLS)
alter table public.ai_insights enable row level security;

-- RLS Policies
create policy "Users can view own insights" 
    on public.ai_insights for select 
    using (auth.uid() = user_id);

create policy "Users can insert own insights" 
    on public.ai_insights for insert 
    with check (auth.uid() = user_id);

create policy "Users can delete own insights" 
    on public.ai_insights for delete 
    using (auth.uid() = user_id);


-- ============================================================================
-- 5. AUTOMATIC PROFILE CREATION TRIGGER
-- ============================================================================
-- This function automatically creates a row in user_profiles when a new user signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.user_profiles (id, display_name)
  values (new.id, split_part(new.email, '@', 1));
  return new;
end;
$$;

-- Trigger the function every time a user is created
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================================
-- 6. DELETE USER ACCOUNT RPC
-- ============================================================================
-- Allows a user to delete their own account securely via Supabase RPC.
create or replace function public.delete_user()
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  delete from auth.users where id = auth.uid();
end;
$$;
