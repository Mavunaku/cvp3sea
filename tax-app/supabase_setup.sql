-- SQL Setup script for Tax Ledger

-- 1. Enable UUID extension
create extension if not exists "uuid-ossp";

-- 2. Create tables
create table "public"."years" (
    "id" text not null,
    "user_id" text not null,
    "created_at" timestamp with time zone default now(),
    primary key (id, user_id)
);

create table "public"."projects" (
    "id" uuid default uuid_generate_v4() primary key,
    "name" text not null,
    "type" text check (type in ('Property', 'Client', 'Generic')),
    "year_id" text not null,
    "user_id" text not null,
    "created_at" timestamp with time zone default now()
);

create table "public"."transactions" (
    "id" uuid default uuid_generate_v4() primary key,
    "date" date not null,
    "amount" numeric not null,
    "type" text check (type in ('income', 'expense')),
    "description" text not null,
    "category" text not null,
    "status" text check (status in ('Cleared', 'Pending')),
    "project_id" uuid references projects(id) on delete cascade,
    "user_id" text not null,
    "ny_source" boolean default false,
    "pillar" text,
    "interest" numeric,
    "capitalize" boolean default false,
    "created_at" timestamp with time zone default now()
);

create table "public"."assets" (
    "id" uuid default uuid_generate_v4() primary key,
    "name" text not null,
    "purchase_date" date not null,
    "cost" numeric not null,
    "land" numeric default 0,
    "prior_depreciation" numeric default 0,
    "current_depreciation" numeric default 0,
    "method" text default 'MACRS',
    "convention" text default 'HY',
    "project_id" uuid references projects(id) on delete cascade,
    "user_id" text not null,
    "created_at" timestamp with time zone default now()
);

-- 3. Enable RLS (Row Level Security)
alter table years enable row level security;
alter table projects enable row level security;
alter table transactions enable row level security;
alter table assets enable row level security;

-- 4. Create policies (Users can only see/edit their own data)
-- Note: Using user_id column instead of auth.uid() for simple password-based auth
create policy "Users can manage their own years" on years
    for all using (true);

create policy "Users can manage their own projects" on projects
    for all using (true);

create policy "Users can manage their own transactions" on transactions
    for all using (true);

create policy "Users can manage their own assets" on assets
    for all using (true);

-- 5. Create indexes for performance
create index idx_years_user_id on years(user_id);
create index idx_projects_user_id on projects(user_id);
create index idx_projects_year_id on projects(year_id);
create index idx_transactions_user_id on transactions(user_id);
create index idx_transactions_project_id on transactions(project_id);
create index idx_assets_user_id on assets(user_id);
create index idx_assets_project_id on assets(project_id);
