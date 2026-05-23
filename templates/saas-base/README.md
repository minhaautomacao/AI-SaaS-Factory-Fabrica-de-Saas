# Template SaaS Base

Template minimalista para qualquer SaaS B2C com autenticação, planos e dashboard.

## O que inclui

- Autenticação completa (email/senha + OAuth Google)
- Dashboard do usuário
- Página de pricing com 3 planos
- Integração Stripe/Mercado Pago
- Proteção de rotas
- Perfil do usuário

## Stack

- Next.js 14 App Router
- TypeScript
- Tailwind CSS + shadcn/ui
- Supabase (auth + banco)
- Stripe (pagamentos)
- Resend (email)
- Vercel (deploy)

## Estrutura de pastas

```
saas-base/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   ├── signup/page.tsx
│   │   └── forgot-password/page.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx          # Layout com sidebar
│   │   ├── dashboard/page.tsx  # Página principal
│   │   └── settings/page.tsx   # Configurações do usuário
│   ├── (marketing)/
│   │   ├── page.tsx            # Landing page
│   │   └── pricing/page.tsx    # Página de preços
│   ├── api/
│   │   ├── auth/
│   │   │   └── callback/route.ts
│   │   ├── stripe/
│   │   │   ├── checkout/route.ts
│   │   │   └── webhook/route.ts
│   │   └── user/
│   │       └── route.ts
│   └── layout.tsx
├── components/
│   ├── ui/                     # shadcn/ui components
│   ├── auth/
│   │   ├── LoginForm.tsx
│   │   └── SignupForm.tsx
│   ├── dashboard/
│   │   ├── Sidebar.tsx
│   │   └── Header.tsx
│   └── marketing/
│       ├── Hero.tsx
│       ├── Features.tsx
│       └── PricingCard.tsx
├── lib/
│   ├── supabase.ts             # Cliente Supabase
│   ├── stripe.ts               # Cliente Stripe
│   ├── email.ts                # Funções de email
│   └── utils.ts                # Utilitários gerais
├── hooks/
│   ├── useUser.ts              # Hook do usuário atual
│   └── useSubscription.ts      # Hook da assinatura
├── types/
│   └── index.ts                # Types TypeScript
├── .env.example
├── package.json
└── supabase/
    └── migrations/
        └── 001_initial.sql     # Schema inicial
```

## Schema do banco (Supabase)

```sql
-- profiles: complementa auth.users
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

-- RLS
alter table public.profiles enable row level security;
create policy "ver proprio perfil" on public.profiles for select using (auth.uid() = id);
create policy "editar proprio perfil" on public.profiles for update using (auth.uid() = id);
```

## Variáveis de ambiente (.env.example)

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRICE_BASICO=price_...
STRIPE_PRICE_PRO=price_...

RESEND_API_KEY=

NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=Meu SaaS
```

## Como usar este template

```bash
# 1. Copiar template
cp -r templates/saas-base meu-novo-saas
cd meu-novo-saas

# 2. Instalar dependências
npm install

# 3. Configurar variáveis de ambiente
cp .env.example .env.local
# Editar .env.local com suas credenciais

# 4. Aplicar migrations no Supabase
supabase link --project-ref SEU_PROJECT_REF
supabase db push

# 5. Rodar localmente
npm run dev
```

## Personalização rápida

1. **Nome e branding**: `NEXT_PUBLIC_APP_NAME` + cores no `tailwind.config.ts`
2. **Planos e preços**: `app/(marketing)/pricing/page.tsx` + IDs de preço no Stripe
3. **Features do dashboard**: `app/(dashboard)/dashboard/page.tsx`
4. **Emails**: Templates em `lib/email.ts`
