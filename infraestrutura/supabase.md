# Supabase — Configuração Gratuita

## Visão geral

Backend completo como serviço: PostgreSQL, autenticação, storage, edge functions e realtime. O plano gratuito suporta projetos em produção com uso moderado.

## Limites do plano gratuito (Free)

| Recurso | Limite |
|---|---|
| Projetos ativos | 2 |
| Banco PostgreSQL | 500 MB |
| Storage | 1 GB |
| Bandwidth | 5 GB/mês |
| Edge Functions | 500.000 invocações/mês |
| Realtime | 200 conexões simultâneas |
| Auth (usuários) | Ilimitado |
| Pausa automática | Após 7 dias sem uso |

> **Atenção**: Projetos gratuitos são pausados após 7 dias de inatividade. Resolva com UptimeRobot fazendo ping a cada 3 dias.

## Configuração passo a passo

### 1. Criar projeto

1. Acesse [supabase.com](https://supabase.com) → **Start your project**
2. Faça login com GitHub
3. **New Project** → escolha organização
4. Defina: nome do projeto, senha do banco, região (South America - São Paulo)
5. Aguarde 2 minutos para provisionar

### 2. Obter credenciais

**Settings → API**:

```
Project URL: https://xxxxxxxxxxxx.supabase.co
anon (public): eyJhbGci...   ← usar no frontend
service_role: eyJhbGci...    ← usar APENAS no backend/server
```

**Settings → Database → Connection string** (para conexões diretas):
```
postgresql://postgres:[senha]@db.xxxx.supabase.co:5432/postgres
```

### 3. Estrutura de banco recomendada

Acesse **SQL Editor** e execute:

```sql
-- Habilitar extensões úteis
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- Tabela de perfis (complementa auth.users)
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text unique not null,
  nome text,
  plano text default 'gratuito',
  criado_em timestamptz default now(),
  atualizado_em timestamptz default now()
);

-- Trigger para criar perfil ao cadastrar usuário
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Row Level Security
alter table public.profiles enable row level security;

create policy "Usuário vê próprio perfil" on public.profiles
  for select using (auth.uid() = id);

create policy "Usuário atualiza próprio perfil" on public.profiles
  for update using (auth.uid() = id);
```

### 4. Autenticação

**Authentication → Providers**:
- Email/Password: já habilitado por padrão
- Google OAuth: adicione Client ID e Secret do Google Cloud Console
- GitHub OAuth: adicione no GitHub Settings → Developer Applications

**Authentication → Email Templates**: Customize os emails de confirmação e reset em português.

**Authentication → URL Configuration**:
```
Site URL: https://meuapp.com.br
Redirect URLs: https://meuapp.com.br/auth/callback
```

### 5. Storage

```sql
-- Criar bucket público para avatares
insert into storage.buckets (id, name, public)
values ('avatares', 'avatares', true);

-- Policy: qualquer um pode ver, só dono pode fazer upload
create policy "Avatares públicos" on storage.objects
  for select using (bucket_id = 'avatares');

create policy "Upload próprio avatar" on storage.objects
  for insert with check (
    bucket_id = 'avatares' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );
```

### 6. Edge Functions

```bash
# Instalar CLI
npm install -g supabase

# Login
supabase login

# Inicializar projeto local
supabase init

# Criar função
supabase functions new minha-funcao

# Deploy
supabase functions deploy minha-funcao --project-ref xxxxxxxxxxxx
```

## Usando no código (TypeScript)

### Instalação

```bash
npm install @supabase/supabase-js
```

### Cliente

```typescript
// lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
```

### Autenticação

```typescript
// Cadastro
const { data, error } = await supabase.auth.signUp({
  email: 'usuario@email.com',
  password: 'senha123'
})

// Login
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'usuario@email.com',
  password: 'senha123'
})

// Logout
await supabase.auth.signOut()

// Usuário atual
const { data: { user } } = await supabase.auth.getUser()
```

### Queries

```typescript
// Buscar dados
const { data, error } = await supabase
  .from('profiles')
  .select('*')
  .eq('plano', 'pro')

// Inserir
const { data, error } = await supabase
  .from('profiles')
  .insert({ nome: 'João', email: 'joao@email.com' })

// Atualizar
const { data, error } = await supabase
  .from('profiles')
  .update({ plano: 'pro' })
  .eq('id', userId)

// Deletar
const { data, error } = await supabase
  .from('profiles')
  .delete()
  .eq('id', userId)
```

## Evitar pausa automática

Configure um monitor no UptimeRobot para fazer GET na URL da API do Supabase a cada 3 dias:

```
https://xxxxxxxxxxxx.supabase.co/rest/v1/
```

Header necessário:
```
apikey: sua-anon-key
```

## Quando migrar para o Pro ($25/mês)

- Banco acima de 500 MB
- Mais de 2 projetos simultâneos
- Não querer a pausa automática
- Precisar de backups diários automáticos
- Suporte por email prioritário
