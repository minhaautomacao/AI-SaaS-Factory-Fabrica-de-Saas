# Template SaaS B2B

Template para SaaS vendido para empresas (B2B): multi-tenant, workspaces, convite de membros, permissões por papel e billing por organização.

## O que inclui

- Multi-tenancy com workspaces/organizações
- Sistema de convites por email
- Papéis: Owner, Admin, Member
- Billing por organização (não por usuário)
- Dashboard de admin da organização
- Portal do cliente Stripe
- Métricas de uso por workspace

## Stack

- Next.js 14 App Router
- TypeScript
- Tailwind CSS + shadcn/ui
- Supabase (auth + banco + RLS)
- Stripe (billing por organização)
- Resend (emails de convite)
- Vercel (deploy)

## Estrutura de pastas

```
saas-b2b/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   ├── signup/page.tsx
│   │   └── invite/[token]/page.tsx   # Aceitar convite
│   ├── (app)/
│   │   ├── layout.tsx                # Layout com workspace selecionado
│   │   ├── [workspace]/
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── settings/
│   │   │   │   ├── page.tsx          # Config do workspace
│   │   │   │   ├── members/page.tsx  # Gerenciar membros
│   │   │   │   └── billing/page.tsx  # Assinatura
│   │   │   └── [feature]/page.tsx    # Features do produto
│   │   └── workspaces/
│   │       ├── page.tsx              # Selecionar workspace
│   │       └── new/page.tsx          # Criar workspace
│   ├── (marketing)/
│   │   ├── page.tsx
│   │   └── pricing/page.tsx
│   └── api/
│       ├── workspaces/route.ts
│       ├── invites/route.ts
│       ├── stripe/
│       │   ├── checkout/route.ts
│       │   └── webhook/route.ts
│       └── auth/callback/route.ts
├── components/
│   ├── workspace/
│   │   ├── WorkspaceSwitcher.tsx
│   │   ├── MembersList.tsx
│   │   └── InviteForm.tsx
│   ├── billing/
│   │   ├── PlanBadge.tsx
│   │   └── UsageBar.tsx
│   └── ui/
├── lib/
│   ├── supabase.ts
│   ├── stripe.ts
│   ├── email.ts
│   └── permissions.ts               # Verificar papéis
├── hooks/
│   ├── useWorkspace.ts
│   ├── useMembers.ts
│   └── usePermissions.ts
└── supabase/
    └── migrations/
        └── 001_b2b_schema.sql
```

## Schema do banco (multi-tenant)

```sql
-- Organizações/Workspaces
create table public.workspaces (
  id uuid default gen_random_uuid() primary key,
  nome text not null,
  slug text unique not null,
  plano text default 'gratuito' check (plano in ('gratuito', 'startup', 'business', 'enterprise')),
  stripe_customer_id text unique,
  stripe_subscription_id text,
  max_membros int default 3,
  criado_em timestamptz default now()
);

-- Membros do workspace
create table public.workspace_members (
  id uuid default gen_random_uuid() primary key,
  workspace_id uuid references public.workspaces(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  papel text default 'member' check (papel in ('owner', 'admin', 'member')),
  criado_em timestamptz default now(),
  unique (workspace_id, user_id)
);

-- Convites pendentes
create table public.invites (
  id uuid default gen_random_uuid() primary key,
  workspace_id uuid references public.workspaces(id) on delete cascade,
  email text not null,
  papel text default 'member',
  token text unique default encode(gen_random_bytes(32), 'hex'),
  criado_por uuid references auth.users(id),
  expira_em timestamptz default (now() + interval '7 days'),
  aceito_em timestamptz,
  unique (workspace_id, email)
);

-- RLS
alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;

create policy "Membros veem workspace"
  on public.workspaces for select
  using (
    id in (
      select workspace_id from public.workspace_members
      where user_id = auth.uid()
    )
  );

create policy "Membros veem outros membros"
  on public.workspace_members for select
  using (
    workspace_id in (
      select workspace_id from public.workspace_members
      where user_id = auth.uid()
    )
  );
```

## Sistema de permissões

```typescript
// lib/permissions.ts
type Papel = 'owner' | 'admin' | 'member'

const PERMISSOES = {
  'gerenciar_membros': ['owner', 'admin'],
  'ver_billing': ['owner'],
  'editar_workspace': ['owner', 'admin'],
  'criar_conteudo': ['owner', 'admin', 'member'],
  'deletar_workspace': ['owner'],
} as const

export function temPermissao(papel: Papel, acao: keyof typeof PERMISSOES): boolean {
  return (PERMISSOES[acao] as readonly string[]).includes(papel)
}
```

## Variáveis de ambiente (.env.example)

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRICE_STARTUP=price_...
STRIPE_PRICE_BUSINESS=price_...

RESEND_API_KEY=

NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=Meu SaaS B2B
```

## Fluxo de onboarding B2B

1. Usuário se cadastra → perfil criado
2. Cria workspace (slug único, ex: `acme`)
3. Vira `owner` do workspace automaticamente
4. Convida membros por email
5. Membros recebem link com token → clicam → criam conta → entram no workspace
6. Owner configura billing (Stripe) para o workspace

## Como usar este template

```bash
cp -r templates/saas-b2b meu-saas-b2b
cd meu-saas-b2b
npm install
cp .env.example .env.local
# Editar .env.local
supabase link --project-ref SEU_PROJECT_REF
supabase db push
npm run dev
```
