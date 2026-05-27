# Skill: Configurar Infraestrutura

## Descrição
Configura toda a infraestrutura necessária para um novo SaaS: Supabase, Vercel, Cloudflare, Upstash e UptimeRobot. Toda a stack gratuita no início, escalável conforme necessidade.

## Quando usar
- Na Etapa 2 do `pipeline-novo-saas.md`
- Invocado pelo comando `/setup-infra`
- Ao reconfigurar infraestrutura de um SaaS existente

---

## 1. Supabase

### Criar projeto
1. Acessar [supabase.com](https://supabase.com) → New Project
2. Configurar:
   - **Name**: `[nome-do-saas]`
   - **Database Password**: gerar senha forte e salvar em `.credentials/infraestrutura/`
   - **Region**: South America (São Paulo) — `sa-east-1`
3. Aguardar provisionamento (~2 min)

### Coletar credenciais
Settings → API → copiar para `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://[projeto].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[anon-key]
SUPABASE_SERVICE_ROLE_KEY=[service-role-key]
```

### Aplicar migrations iniciais
```bash
supabase login
supabase link --project-ref [ref-do-projeto]
supabase db push
```

### Configurar Auth
Authentication → Settings:
- **Site URL**: `https://[dominio-do-saas]`
- **Redirect URLs**: adicionar `https://[dominio-do-saas]/auth/callback`
- Desabilitar "Confirm email" em desenvolvimento

### Limites do plano gratuito
| Recurso | Limite free | Quando migrar |
|---|---|---|
| Banco de dados | 500 MB | Ao atingir 400 MB |
| Auth | 50.000 usuários | Ao atingir 40.000 |
| Storage | 1 GB | Ao atingir 800 MB |
| Edge Functions | 500.000 invocações/mês | Ao atingir 400.000 |

---

## 2. Vercel

### Conectar repositório
1. Acessar [vercel.com](https://vercel.com) → New Project
2. Importar repositório do GitHub
3. Framework: **Next.js** (detectado automaticamente)
4. Build Command: `npm run build`
5. Output Directory: `.next`

### Configurar variáveis de ambiente
Settings → Environment Variables → adicionar todas as do `.env.local`:
- Marcar `Production`, `Preview` e `Development`
- Nunca expor `SUPABASE_SERVICE_ROLE_KEY` como variável pública (`NEXT_PUBLIC_`)

### Domínio personalizado
Settings → Domains → Add Domain:
1. Adicionar `[dominio-do-saas]`
2. Copiar os registros DNS fornecidos (usar no Cloudflare)

### Limites do plano gratuito
| Recurso | Limite free | Quando migrar |
|---|---|---|
| Bandwidth | 100 GB/mês | Ao atingir 80 GB |
| Serverless Functions | 100 GB-hora/mês | Ao atingir 80 GB-hora |
| Builds | 6.000 min/mês | Ao atingir 5.000 min |

---

## 3. Cloudflare

### Adicionar domínio
1. Acessar [cloudflare.com](https://cloudflare.com) → Add a Site
2. Inserir `[dominio-do-saas]`
3. Plano: **Free**
4. Cloudflare fornece 2 nameservers — atualizá-los no registrador do domínio

### Configurar DNS
Adicionar registros fornecidos pela Vercel:
```
Tipo    Nome    Valor                   Proxy
CNAME   @       cname.vercel-dns.com    ✅ Proxied
CNAME   www     cname.vercel-dns.com    ✅ Proxied
```

### SSL/TLS
SSL/TLS → Overview → Mode: **Full (strict)**

### Configurações recomendadas
- Speed → Optimization: ativar **Auto Minify** (JS, CSS, HTML)
- Caching → Configuration: Cache Level = **Standard**
- Security → Settings: Security Level = **Medium**

### Tempo de propagação
DNS propaga em 5–30 minutos com Cloudflare. Verificar em [dnschecker.org](https://dnschecker.org).

---

## 4. Upstash Redis

### Criar banco Redis
1. Acessar [upstash.com](https://upstash.com) → Create Database
2. Configurar:
   - **Name**: `[nome-do-saas]-redis`
   - **Type**: Regional
   - **Region**: South America (São Paulo)
   - **TLS**: ✅ ativado
3. Copiar credenciais para `.env.local`:

```env
UPSTASH_REDIS_REST_URL=https://[endpoint].upstash.io
UPSTASH_REDIS_REST_TOKEN=[token]
```

### Configurar BullMQ
```typescript
// lib/queue.ts
import { Queue, Worker } from 'bullmq'
import { Redis } from 'ioredis'

const connection = new Redis(process.env.UPSTASH_REDIS_REST_URL!, {
  tls: { rejectUnauthorized: false },
  maxRetriesPerRequest: null,
})

export const queueProducaoUrgente = new Queue('producao:urgente', { connection })
export const queueProducaoNormal = new Queue('producao:normal', { connection })
export const queueFabrica = new Queue('fabrica', { connection })
```

### Limites do plano gratuito
| Recurso | Limite free | Quando migrar |
|---|---|---|
| Comandos/dia | 10.000 | Ao atingir 8.000 |
| Storage | 256 MB | Ao atingir 200 MB |
| Bandwidth | 200 MB/mês | Ao atingir 160 MB |

---

## 5. UptimeRobot

### Criar monitor
1. Acessar [uptimerobot.com](https://uptimerobot.com) → Add New Monitor
2. Configurar:
   - **Monitor Type**: HTTP(s)
   - **Friendly Name**: `[Nome do SaaS]`
   - **URL**: `https://[dominio-do-saas]`
   - **Monitoring Interval**: 5 minutes
3. **Alert Contacts**: adicionar email + WhatsApp do operador

### Criar status page (opcional)
My Status Pages → Create Status Page:
- Nome: `[Nome do SaaS] — Status`
- URL: `status.[dominio-do-saas]`
- Adicionar todos os monitors criados

### Verificação final
Após configurar todos os serviços, rodar:
```bash
# Verificar variáveis de ambiente
npm run typecheck

# Verificar build
npm run build

# Testar localmente com variáveis de produção
npm run start
```

---

## Resumo de credenciais necessárias

Ao final desta etapa, o `.env.local` deve ter:
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Upstash
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# App
NEXT_PUBLIC_APP_URL=https://[dominio]
NEXT_PUBLIC_APP_NAME=[Nome do SaaS]
```

Vercel deve ter todas essas variáveis configuradas em Settings → Environment Variables.
