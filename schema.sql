create extension if not exists pgcrypto;

-- Enable pgvector
create extension if not exists vector;

-- Tenants
create table if not exists tenants(
  id uuid primary key default gen_random_uuid(),
  name text not null,
  domain text,
  plan text default 'basic',
  created_at timestamp with time zone default now()
);

-- Users (פשטני; לשילוב Auth אמיתי היעזרו ב-Supabase Auth/Clerk)
create table if not exists users(
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references tenants(id) on delete cascade,
  email text unique not null,
  role text check (role in ('owner','admin','editor')) not null default 'owner',
  created_at timestamp with time zone default now()
);

-- Bots
create table if not exists bots(
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references tenants(id) on delete cascade,
  name text not null,
  model text default 'gpt-4o-mini',
  system_prompt text default '',
  created_at timestamp with time zone default now()
);

-- Sources
create table if not exists sources(
  id uuid primary key default gen_random_uuid(),
  bot_id uuid references bots(id) on delete cascade,
  type text check (type in ('file','url','qa','text')) not null,
  uri text,
  title text,
  last_ingested_at timestamp with time zone
);

-- Chunks (pgvector 3072 for text-embedding-3-large)
create table if not exists chunks(
  id bigserial primary key,
  bot_id uuid references bots(id) on delete cascade,
  source_id uuid references sources(id) on delete set null,
  content text,
  embedding vector(3072)
);

-- Conversations
create table if not exists conversations(
  id uuid primary key default gen_random_uuid(),
  bot_id uuid references bots(id) on delete cascade,
  external_user_id text,
  channel text check (channel in ('web','whatsapp','api')) not null default 'web',
  created_at timestamp with time zone default now()
);

-- Messages
create table if not exists messages(
  id bigserial primary key,
  conversation_id uuid references conversations(id) on delete cascade,
  role text check (role in ('user','assistant','system')),
  content text,
  created_at timestamp with time zone default now()
);

-- Leads
create table if not exists leads(
  id uuid primary key default gen_random_uuid(),
  bot_id uuid references bots(id) on delete cascade,
  name text,
  phone text,
  email text,
  meta jsonb,
  created_at timestamp with time zone default now()
);

-- Similarity search: match_chunks
create or replace function match_chunks(p_bot_id uuid, p_query_embedding vector(3072), p_match_count int default 6, p_min_similarity float default 0.2)
returns table(content text, similarity float)
language sql stable as $$
  select content, 1 - (embedding <=> p_query_embedding) as similarity
  from chunks
  where bot_id = p_bot_id
  order by embedding <=> p_query_embedding
  limit p_match_count
$$;


-- Q&A items per bot (editable in client portal)
create table if not exists qa_items(
  id bigserial primary key,
  bot_id uuid references bots(id) on delete cascade,
  q text not null,
  a text not null,
  created_at timestamp with time zone default now()
);


-- Bot settings (editable by client)
create table if not exists bot_settings(
  bot_id uuid primary key references bots(id) on delete cascade,
  welcome_text text default null,
  cta_text text default null,
  cta_url text default null,
  rtl boolean default true,
  badge boolean default true,
  brand text default 'mini-fastbots',
  brand_url text default 'https://ycbots.com',
  language text default 'he',
  top_k int default 6,
  updated_at timestamp with time zone default now()
);


-- ===== Usage limits per external user per month =====
create table if not exists usage_limits (
  tenant_id uuid not null,
  bot_id uuid not null,
  external_user_id text not null,
  period_start date not null,
  msg_count int not null default 0,
  msg_limit int not null default 10000,
  primary key (tenant_id, bot_id, external_user_id, period_start)
);

-- Add tenant_id to leads (if missing)
do $$ begin
  if not exists (select 1 from information_schema.columns where table_name='leads' and column_name='tenant_id') then
    alter table leads add column tenant_id uuid;
    -- backfill from bots
    update leads l set tenant_id = b.tenant_id from bots b where l.bot_id = b.id and l.tenant_id is null;
  end if;
end $$;

-- Extend bot_settings with channel toggles
do $$ begin
  if not exists (select 1 from information_schema.columns where table_name='bot_settings' and column_name='channels_web') then
    alter table bot_settings add column channels_web boolean default true;
  end if;
  if not exists (select 1 from information_schema.columns where table_name='bot_settings' and column_name='channels_whatsapp') then
    alter table bot_settings add column channels_whatsapp boolean default false;
  end if;
  if not exists (select 1 from information_schema.columns where table_name='bot_settings' and column_name='channels_messenger') then
    alter table bot_settings add column channels_messenger boolean default false;
  end if;
end $$;

-- Atomic upsert+increment RPC for usage counting
create or replace function inc_usage(
  p_tenant_id uuid,
  p_bot_id uuid,
  p_external_user_id text,
  p_period_start date,
  p_limit int default 10000
) returns table(msg_count int, allowed boolean)
language plpgsql as $$
begin
  insert into usage_limits (tenant_id, bot_id, external_user_id, period_start, msg_count, msg_limit)
  values (p_tenant_id, p_bot_id, p_external_user_id, p_period_start, 1, p_limit)
  on conflict (tenant_id, bot_id, external_user_id, period_start)
  do update set msg_count = usage_limits.msg_count + 1
  returning usage_limits.msg_count, (usage_limits.msg_count <= usage_limits.msg_limit) as allowed
  into msg_count, allowed;

  return;
end;
$$;

-- (Optional) RLS skeleton (enable after wiring Supabase Auth):
-- alter table tenants enable row level security;
-- alter table bots enable row level security;
-- alter table sources enable row level security;
-- alter table chunks enable row level security;
-- alter table conversations enable row level security;
-- alter table messages enable row level security;
-- alter table leads enable row level security;
-- alter table bot_settings enable row level security;
-- alter table qa_items enable row level security;
-- alter table usage_limits enable row level security;
-- create policy "tenant read" on bots for select using (true);
-- etc...
