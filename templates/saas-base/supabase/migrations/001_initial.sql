-- Migration inicial do SaaS Base
-- Executar via: supabase db push

-- Extensões
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- Tabela de perfis
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text unique not null,
  nome text,
  avatar_url text,
  plano text default 'gratuito' check (plano in ('gratuito', 'basico', 'pro')),
  stripe_customer_id text unique,
  stripe_subscription_id text,
  criado_em timestamptz default now(),
  atualizado_em timestamptz default now()
);

-- Trigger para criar perfil ao cadastrar
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

-- Trigger para atualizar atualizado_em
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.atualizado_em = now();
  return new;
end;
$$ language plpgsql;

create trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.handle_updated_at();

-- RLS (Row Level Security)
alter table public.profiles enable row level security;

create policy "Usuários veem próprio perfil"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Usuários editam próprio perfil"
  on public.profiles for update
  using (auth.uid() = id);

-- Storage: avatares
insert into storage.buckets (id, name, public)
values ('avatares', 'avatares', true)
on conflict do nothing;

create policy "Avatares públicos"
  on storage.objects for select
  using (bucket_id = 'avatares');

create policy "Upload próprio avatar"
  on storage.objects for insert
  with check (
    bucket_id = 'avatares'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Deletar próprio avatar"
  on storage.objects for delete
  using (
    bucket_id = 'avatares'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
