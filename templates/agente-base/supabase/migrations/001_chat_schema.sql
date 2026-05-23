-- Migration: Schema do Agente de IA
-- Executar via: supabase db push

create extension if not exists "uuid-ossp";

-- Perfis
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text unique not null,
  nome text,
  criado_em timestamptz default now()
);

-- Conversas com agentes
create table public.conversas (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  titulo text default 'Nova conversa',
  agente text default 'assistente',
  tokens_totais int default 0,
  criado_em timestamptz default now(),
  atualizado_em timestamptz default now()
);

-- Mensagens individuais
create table public.mensagens (
  id uuid default gen_random_uuid() primary key,
  conversa_id uuid references public.conversas(id) on delete cascade not null,
  papel text not null check (papel in ('user', 'assistant', 'tool_use', 'tool_result')),
  conteudo text not null,
  metadados jsonb,          -- tool_name, tool_input, tool_result, etc.
  tokens_usados int,
  criado_em timestamptz default now()
);

-- Índices para performance
create index idx_conversas_user_id on public.conversas(user_id);
create index idx_conversas_criado_em on public.conversas(criado_em desc);
create index idx_mensagens_conversa_id on public.mensagens(conversa_id);
create index idx_mensagens_criado_em on public.mensagens(criado_em asc);

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

-- Trigger: atualizar timestamp e tokens da conversa
create or replace function public.handle_nova_mensagem()
returns trigger as $$
begin
  update public.conversas
  set
    atualizado_em = now(),
    tokens_totais = tokens_totais + coalesce(new.tokens_usados, 0)
  where id = new.conversa_id;
  return new;
end;
$$ language plpgsql;

create trigger on_mensagem_criada
  after insert on public.mensagens
  for each row execute procedure public.handle_nova_mensagem();

-- RLS
alter table public.profiles enable row level security;
alter table public.conversas enable row level security;
alter table public.mensagens enable row level security;

-- Policies: profiles
create policy "Ver próprio perfil" on public.profiles
  for select using (auth.uid() = id);

create policy "Editar próprio perfil" on public.profiles
  for update using (auth.uid() = id);

-- Policies: conversas
create policy "Ver próprias conversas" on public.conversas
  for select using (auth.uid() = user_id);

create policy "Criar conversa" on public.conversas
  for insert with check (auth.uid() = user_id);

create policy "Atualizar própria conversa" on public.conversas
  for update using (auth.uid() = user_id);

create policy "Deletar própria conversa" on public.conversas
  for delete using (auth.uid() = user_id);

-- Policies: mensagens (acesso via conversa do usuário)
create policy "Ver mensagens de conversas próprias" on public.mensagens
  for select using (
    conversa_id in (select id from public.conversas where user_id = auth.uid())
  );

create policy "Inserir mensagens em conversas próprias" on public.mensagens
  for insert with check (
    conversa_id in (select id from public.conversas where user_id = auth.uid())
  );
