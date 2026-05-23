# Fábrica de SaaS — Instruções para o Claude

## O que é este projeto

Sistema automatizado para criar, configurar e lançar SaaS completos usando IA. O objetivo é ter um processo repetível que vai desde a ideia até o produto online em produção, usando apenas ferramentas gratuitas ou de baixo custo.

## Contexto e objetivos

- **Público-alvo**: Empreendedores e desenvolvedores brasileiros que querem criar produtos digitais com baixo investimento inicial
- **Stack padrão**: React/Next.js + Supabase + Vercel + Cloudflare
- **Idioma**: Português brasileiro em toda a documentação e interfaces
- **Filosofia**: Infraestrutura gratuita no início, escalável conforme necessidade

## Estrutura do projeto

```
fabrica-saas/
├── CLAUDE.md              # Este arquivo — instruções para IA
├── .claude/               # Configurações do Claude Code
│   ├── memory/            # Memórias persistentes entre sessões
│   ├── skills/            # Skills customizados
│   ├── agents/            # Agentes especializados
│   └── commands/          # Comandos slash customizados
├── .credentials/          # Templates de credenciais (nunca commitar valores reais)
│   ├── financeiro/
│   ├── marketing/
│   ├── whatsapp/
│   ├── logistica/
│   ├── comunicacao/
│   └── infraestrutura/
├── infraestrutura/        # Guias de configuração gratuita
│   ├── vercel.md
│   ├── supabase.md
│   ├── render.md
│   ├── upstash.md
│   ├── uptimerobot.md
│   └── cloudflare.md
├── templates/             # Estruturas iniciais prontas
│   ├── saas-base/
│   ├── saas-b2b/
│   └── agente-base/
└── src/                   # Código da aplicação web
```

## Regras de desenvolvimento

### O que fazer sempre
- Escrever código limpo e sem comentários óbvios
- Usar TypeScript com tipagem estrita
- Validar inputs do usuário nas bordas do sistema (APIs, formulários)
- Seguir a estrutura de pastas estabelecida
- Commitar com mensagens claras em português

### O que nunca fazer
- Commitar arquivos `.env` ou credenciais reais
- Adicionar dependências sem necessidade clara
- Criar abstrações prematuras para código que só existe uma vez
- Deixar `console.log` de debug no código de produção

## Stack técnica

### Frontend
- **Framework**: React 18 + Vite (ou Next.js para novos projetos)
- **Estilo**: Tailwind CSS
- **Estado**: Zustand para estado global, useState para estado local
- **Formulários**: React Hook Form + Zod

### Backend
- **BaaS**: Supabase (auth, banco, storage, edge functions)
- **Deploy**: Vercel (frontend) ou Render (APIs Node.js)
- **Cache/Queue**: Upstash Redis
- **DNS/CDN**: Cloudflare

### Integrações frequentes
- **Pagamentos**: Stripe ou Mercado Pago
- **WhatsApp**: Evolution API (self-hosted) ou Z-API
- **Email**: Resend (gratuito até 3.000 emails/mês)
- **Monitoramento**: UptimeRobot (gratuito)

## Fluxo de trabalho

### Novo SaaS
1. Copiar template adequado (`saas-base` ou `saas-b2b`)
2. Configurar Supabase (banco + auth)
3. Configurar Vercel (deploy + domínio)
4. Configurar Cloudflare (DNS)
5. Configurar UptimeRobot (monitoramento)
6. Implementar features do produto

### Deploy
```bash
git push origin main  # Deploy automático via Vercel
```

### Banco de dados
- Usar migrations do Supabase para todas as alterações de schema
- Nunca alterar o banco direto em produção sem migration
- Testar em branch Supabase antes de aplicar em prod

## Variáveis de ambiente obrigatórias

Todo SaaS criado aqui precisa dessas variáveis configuradas:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Auth
NEXTAUTH_SECRET=
NEXTAUTH_URL=

# App
NEXT_PUBLIC_APP_URL=
NEXT_PUBLIC_APP_NAME=
```

## Comandos úteis

```bash
# Desenvolvimento local
npm run dev

# Build de produção
npm run build

# Verificar tipos TypeScript
npm run typecheck

# Supabase local
supabase start
supabase db diff     # ver mudanças pendentes
supabase db push     # aplicar migrations
```

## Contato e repositório

- **GitHub**: https://github.com/minhaautomacao/AI-SaaS-Factory-Fabrica-de-Saas
- **Email**: minhaautomacao10@gmail.com
