-- Migration B2B Schema
-- Executar via: supabase db push

create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- Perfis de usuários
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text unique not null,
  nome text,
  avatar_url text,
  criado_em timestamptz default now()
);

-- Workspaces (organizações)
create table public.workspaces (
  id uuid default gen_random_uuid() primary key,
  nome text not null,
  slug text unique not null,
  plano text default 'gratuito' check (plano in ('gratuito', 'startup', 'business', 'enterprise')),
  stripe_customer_id text unique,
  stripe_subscription_id text,
  max_membros int default 3,
  criado_em timestamptz default now(),
  atualizado_em timestamptz default now()
);

-- Membros dos workspaces
create table public.workspace_members (
  id uuid default gen_random_uuid() primary key,
  workspace_id uuid references public.workspaces(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  papel text default 'member' check (papel in ('owner', 'admin', 'member')),
  criado_em timestamptz default now(),
  unique (workspace_id, user_id)
);

-- Convites
create table public.invites (
  id uuid default gen_random_uuid() primary key,
  workspace_id uuid references public.workspaces(id) on delete cascade not null,
  email text not null,
  papel text default 'member' check (papel in ('admin', 'member')),
  token text unique default encode(gen_random_bytes(32), 'hex') not null,
  criado_por uuid references auth.users(id) not null,
  expira_em timestamptz default (now() + interval '7 days') not null,
  aceito_em timestamptz,
  unique (workspace_id, email)
);

-- Trigger: criar perfil ao cadastrar
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, nome)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Trigger: atualizar timestamp
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.atualizado_em = now();
  return new;
end;
$$ language plpgsql;

create trigger set_workspaces_updated_at
  before update on public.workspaces
  for each row execute procedure public.handle_updated_at();

-- RLS
alter table public.profiles enable row level security;
alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.invites enable row level security;

-- Policies: profiles
create policy "Ver próprio perfil"
  on public.profiles for select using (auth.uid() = id);

create policy "Editar próprio perfil"
  on public.profiles for update using (auth.uid() = id);

-- Policies: workspaces
create policy "Membros veem workspace"
  on public.workspaces for select
  using (
    id in (select workspace_id from public.workspace_members where user_id = auth.uid())
  );

create policy "Owner edita workspace"
  on public.workspaces for update
  using (
    id in (
      select workspace_id from public.workspace_members
      where user_id = auth.uid() and papel = 'owner'
    )
  );

-- Policies: workspace_members
create policy "Membros veem outros membros do workspace"
  on public.workspace_members for select
  using (
    workspace_id in (
      select workspace_id from public.workspace_members where user_id = auth.uid()
    )
  );

create policy "Owner/Admin gerencia membros"
  on public.workspace_members for all
  using (
    workspace_id in (
      select workspace_id from public.workspace_members
      where user_id = auth.uid() and papel in ('owner', 'admin')
    )
  );

-- Policies: invites
create policy "Admin/Owner vê convites do workspace"
  on public.invites for select
  using (
    workspace_id in (
      select workspace_id from public.workspace_members
      where user_id = auth.uid() and papel in ('owner', 'admin')
    )
  );

create policy "Admin/Owner cria convites"
  on public.invites for insert
  with check (
    workspace_id in (
      select workspace_id from public.workspace_members
      where user_id = auth.uid() and papel in ('owner', 'admin')
    )
  );
