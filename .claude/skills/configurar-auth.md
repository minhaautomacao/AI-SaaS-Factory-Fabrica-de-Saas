# Skill: Configurar Autenticação

## Descrição
Configura autenticação completa usando Supabase Auth: tabela de perfis, políticas RLS, componentes de login/signup, rotas protegidas e login social.

## Quando usar
- Na Etapa 3 do `pipeline-novo-saas.md`
- Invocado pelo comando `/setup-auth`
- Ao adicionar autenticação a um projeto existente

---

## 1. Verificar o que já existe

Antes de criar qualquer coisa:
```bash
# Verificar se tabela profiles já existe
supabase db diff

# Verificar se componentes de auth já existem
ls src/components/auth/
ls src/app/(auth)/
```

Se já existir: verificar se está atualizado com o padrão atual. Se não existir: seguir os passos abaixo.

---

## 2. Migration — tabela profiles e RLS

Criar arquivo `supabase/migrations/[timestamp]_auth_profiles.sql`:

```sql
-- Tabela de perfis vinculada ao auth.users
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  nome TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'user',   -- 'user' | 'admin' | 'operador'
  ativo BOOLEAN NOT NULL DEFAULT true,
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: habilitar
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Política: usuário vê apenas o próprio perfil
CREATE POLICY "Usuário vê próprio perfil"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

-- Política: usuário atualiza apenas o próprio perfil
CREATE POLICY "Usuário atualiza próprio perfil"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Admin vê todos os perfis
CREATE POLICY "Admin vê todos os perfis"
  ON public.profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Trigger: criar profile automaticamente ao criar usuário
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

Aplicar:
```bash
supabase db push
```

---

## 3. Cliente Supabase

Criar `lib/supabase/client.ts`:
```typescript
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

Criar `lib/supabase/server.ts`:
```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )
}
```

---

## 4. Middleware — rotas protegidas

Criar `middleware.ts` na raiz:
```typescript
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // Redirecionar para login se não autenticado em rota protegida
  if (!user && request.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Redirecionar para dashboard se já autenticado tentando acessar login
  if (user && ['/login', '/signup'].includes(request.nextUrl.pathname)) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/dashboard/:path*', '/login', '/signup'],
}
```

---

## 5. Componentes de autenticação

### Página de login `src/app/(auth)/login/page.tsx`
```typescript
'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError('Email ou senha inválidos')
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <form onSubmit={handleLogin} className="flex flex-col gap-4 max-w-sm mx-auto mt-20">
      <h1 className="text-2xl font-bold">Entrar</h1>
      {error && <p className="text-red-500 text-sm">{error}</p>}
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        required
        className="border rounded px-3 py-2"
      />
      <input
        type="password"
        placeholder="Senha"
        value={password}
        onChange={e => setPassword(e.target.value)}
        required
        className="border rounded px-3 py-2"
      />
      <button
        type="submit"
        disabled={loading}
        className="bg-black text-white rounded px-4 py-2 disabled:opacity-50"
      >
        {loading ? 'Entrando...' : 'Entrar'}
      </button>
    </form>
  )
}
```

### Botão de logout
```typescript
'use client'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export function LogoutButton() {
  const supabase = createClient()
  const router = useRouter()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <button onClick={handleLogout} className="text-sm text-gray-600 hover:text-black">
      Sair
    </button>
  )
}
```

---

## 6. Login social (opcional)

Para adicionar Google ou GitHub:

**Supabase Dashboard** → Authentication → Providers → ativar o provider

**Adicionar botão:**
```typescript
async function handleGoogleLogin() {
  const supabase = createClient()
  await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  })
}
```

**Criar callback** `src/app/auth/callback/route.ts`:
```typescript
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const supabase = await createClient()
    await supabase.auth.exchangeCodeForSession(code)
  }

  return NextResponse.redirect(`${origin}/dashboard`)
}
```

---

## 7. Verificação final

```bash
# Verificar tipos TypeScript
npm run typecheck

# Testar fluxo completo
# 1. Acessar /dashboard sem login → deve redirecionar para /login
# 2. Fazer login → deve ir para /dashboard
# 3. Atualizar a página → deve permanecer logado
# 4. Clicar em sair → deve ir para /login
# 5. Verificar tabela profiles no Supabase: registro criado automaticamente
```

✅ Auth configurada e funcionando.
