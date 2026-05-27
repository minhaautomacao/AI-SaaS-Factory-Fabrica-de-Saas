---
name: setup-auth
description: Configura autenticação completa com Supabase no projeto atual — tabela profiles, RLS, componentes de login/signup e rotas protegidas
---

# Setup Auth

$ARGUMENTS

## O que este comando faz

Implementa autenticação completa com Supabase Auth no projeto atual. Cobre backend (schema + RLS) e frontend (componentes + rotas protegidas).

## Pré-requisitos

Antes de executar, verifique:
- [ ] Projeto tem `@supabase/supabase-js` instalado
- [ ] `.env` tem `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` preenchidos
- [ ] Supabase Auth está habilitado no projeto (Email/Password ativo)

## Passos

### 1. Verificar o projeto atual

Leia o `package.json` e identifique:
- Framework: Next.js (App Router ou Pages Router) ou React + Vite
- Versão do Supabase client instalado
- Estrutura de pastas existente

### 2. Criar migration do banco

Arquivo: `supabase/migrations/[timestamp]_auth_profiles.sql`

```sql
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nome text,
  avatar_url text,
  atualizado_em timestamptz default now()
);

alter table profiles enable row level security;

create policy "usuario_ve_proprio_perfil" on profiles
  for select using (auth.uid() = id);

create policy "usuario_edita_proprio_perfil" on profiles
  for update using (auth.uid() = id);

-- Trigger: cria profile automaticamente ao cadastrar usuário
create or replace function criar_profile_novo_usuario()
returns trigger language plpgsql security definer as $$
begin
  insert into profiles(id, nome)
  values (new.id, split_part(new.email, '@', 1));
  return new;
end;
$$;

create trigger ao_criar_usuario
  after insert on auth.users
  for each row execute function criar_profile_novo_usuario();

-- Rollback:
-- drop trigger ao_criar_usuario on auth.users;
-- drop function criar_profile_novo_usuario();
-- drop table profiles cascade;
```

### 3. Criar cliente Supabase

Arquivo: `src/lib/supabase.ts`

```typescript
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

export const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
```

### 4. Criar componentes de autenticação

Criar `src/components/auth/FormLogin.tsx` (email + senha + link para cadastro)  
Criar `src/components/auth/FormCadastro.tsx` (email + senha + confirmação)  
Criar `src/components/auth/BotaoSair.tsx` (chama `supabase.auth.signOut()`)

### 5. Criar hook de autenticação

Arquivo: `src/hooks/useAuth.ts`

```typescript
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user)
      setCarregando(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  return { user, carregando }
}
```

### 6. Criar rota protegida

**Next.js App Router** → `src/middleware.ts` com `updateSession` do `@supabase/ssr`  
**Next.js Pages Router** → HOC `withAuth` que redireciona para `/login` se não autenticado  
**React + Vite** → Componente `<RotaProtegida>` que verifica `useAuth` antes de renderizar filhos

### 7. Aplicar migration e verificar

```bash
supabase db push
# Verificar no Supabase Dashboard:
# - Tabela profiles criada
# - RLS habilitado
# - Trigger ativo em Authentication > Hooks
```

### 8. Commitar

```bash
git add supabase/migrations/ src/lib/supabase.ts src/hooks/useAuth.ts src/components/auth/
git commit -m "Configura autenticação completa com Supabase"
```

## Referências

- Guia Supabase: `infraestrutura/supabase.md`
- Skill detalhado: `.claude/skills/configurar-auth.md`
- Variáveis necessárias: `CLAUDE.md` seção "Variáveis de ambiente obrigatórias"
