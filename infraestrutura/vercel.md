# Vercel — Configuração Gratuita

## Visão geral

Hospedagem com deploy automático via GitHub. O plano Hobby (gratuito) cobre a maioria dos projetos iniciais com HTTPS, domínio customizado e CI/CD automático.

## Limites do plano gratuito (Hobby)

| Recurso | Limite |
|---|---|
| Deployments | Ilimitados |
| Bandwidth | 100 GB/mês |
| Serverless Functions | 100 GB-hs/mês |
| Edge Functions | 500.000 req/mês |
| Domínios customizados | Ilimitados |
| Teammates | 1 (só você) |

## Configuração passo a passo

### 1. Criar conta

1. Acesse [vercel.com](https://vercel.com) → **Sign Up**
2. Escolha **Continue with GitHub**
3. Autorize o acesso ao GitHub

### 2. Primeiro deploy

1. Dashboard → **Add New → Project**
2. Selecione o repositório GitHub
3. Framework: Vercel detecta automaticamente (Next.js, Vite, etc.)
4. Configure variáveis de ambiente (aba **Environment Variables**)
5. Clique em **Deploy**

### 3. Variáveis de ambiente

**Settings → Environment Variables** no painel do projeto:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIs...
NEXTAUTH_SECRET=chave-gerada-com-openssl
NEXTAUTH_URL=https://meuapp.vercel.app
```

Gerar NEXTAUTH_SECRET:
```bash
openssl rand -base64 32
```

### 4. Domínio customizado

1. **Settings → Domains → Add**
2. Digite seu domínio (ex: `meuapp.com.br`)
3. Vercel exibe registros DNS — copie-os
4. No Cloudflare, adicione os registros CNAME/A
5. Propagação: geralmente 2–5 minutos no Cloudflare

### 5. Deploy automático

- `git push origin main` → deploy de produção
- Pull Requests → preview deployment com URL única
- Rollback: **Deployments → selecionar versão anterior → Promote to Production**

## vercel.json recomendado

Crie na raiz do projeto:

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" }
      ]
    }
  ],
  "rewrites": [
    { "source": "/api/(.*)", "destination": "/api/$1" }
  ]
}
```

## CLI Vercel

```bash
npm i -g vercel
vercel login
vercel              # deploy de desenvolvimento
vercel --prod       # deploy de produção
vercel env pull     # baixar variáveis para .env.local
vercel logs         # ver logs em tempo real
```

## Quando migrar para o Pro ($20/mês)

- Bandwidth acima de 100 GB/mês
- Precisar de time com mais de 1 pessoa
- Necessitar de password protection para previews
- SLA de suporte prioritário

## Problemas comuns

**Build falha**: Verifique se as variáveis de ambiente estão configuradas no painel (não só no `.env` local).

**Função timeout**: Serverless functions têm timeout de 10s no plano gratuito. Para processos longos, use Supabase Edge Functions ou Render.

**Domínio não propaga**: Confirme que o nameserver do domínio aponta para o Cloudflare, não para o registrador original.
