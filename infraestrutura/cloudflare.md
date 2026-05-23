# Cloudflare — Configuração Gratuita

## Visão geral

DNS, CDN, proteção DDoS e proxy reverso. O plano gratuito é extremamente generoso e mais do que suficiente para qualquer SaaS iniciante. Usar Cloudflare é praticamente obrigatório para qualquer produto sério.

## O que o plano gratuito inclui

| Recurso | Limite |
|---|---|
| DNS gerenciado | Ilimitado |
| CDN global | Ilimitado |
| Proteção DDoS | Ilimitado |
| Certificado SSL | Automático (Let's Encrypt) |
| Regras de firewall | 5 regras |
| Page Rules | 3 regras |
| Workers | 100.000 req/dia |
| Analytics | Básico |
| Email Routing | Ilimitado |
| R2 Storage | 10 GB |

## Configuração passo a passo

### 1. Criar conta

1. Acesse [cloudflare.com](https://cloudflare.com) → **Sign Up**
2. Crie conta com email

### 2. Adicionar seu domínio

1. Dashboard → **Add a Site**
2. Digite seu domínio (ex: `meuapp.com.br`)
3. Selecione plano **Free**
4. Cloudflare importa os registros DNS automaticamente
5. **Copie os nameservers** que a Cloudflare exibe (dois endereços `.ns.cloudflare.com`)
6. No seu registrador de domínio (Registro.br, GoDaddy, etc.), substitua os nameservers pelos da Cloudflare
7. Aguarde propagação (até 24h, geralmente minutos)

### 3. Configurar SSL

**SSL/TLS → Overview**:
- Selecione **Full (strict)** para máxima segurança
- Isso requer que o servidor de origem também tenha SSL válido (Vercel e Render já têm)

**SSL/TLS → Edge Certificates**:
- Habilite **Always Use HTTPS** ✓
- Habilite **Automatic HTTPS Rewrites** ✓
- **Minimum TLS Version**: TLS 1.2

### 4. Registros DNS essenciais

No painel → **DNS → Records**:

**Para Vercel** (frontend):
```
Tipo: CNAME
Nome: @
Conteúdo: cname.vercel-dns.com
Proxy: ✓ (laranja — passando pela Cloudflare)
```

```
Tipo: CNAME
Nome: www
Conteúdo: cname.vercel-dns.com
Proxy: ✓
```

**Para Render** (backend/API):
```
Tipo: CNAME
Nome: api
Conteúdo: meu-backend.onrender.com
Proxy: ✓
```

**Para Supabase** (opcional, subdomínio personalizado):
```
Tipo: CNAME
Nome: db
Conteúdo: xxxx.supabase.co
Proxy: ✗ (cinza — bypass, Supabase não funciona com proxy Cloudflare)
```

**Email (se usar Google Workspace ou Resend)**:
```
Tipo: MX
Nome: @
Conteúdo: aspmx.l.google.com
Prioridade: 1
```

**Status page (UptimeRobot)**:
```
Tipo: CNAME
Nome: status
Conteúdo: stats.uptimerobot.com
Proxy: ✗
```

### 5. Email Routing (emails gratuitos)

Redirecionar `contato@meuapp.com.br` para seu Gmail pessoal:

1. **Email → Email Routing → Enable Email Routing**
2. **Add Address**: `contato@meuapp.com.br` → `seu@gmail.com`
3. Cloudflare adiciona os registros MX automaticamente

Agora todo email enviado para `contato@meuapp.com.br` chega no seu Gmail.

### 6. Regras de firewall básicas

**Security → WAF → Custom Rules**:

**Bloquear países suspeitos** (opcional):
```
Campo: Country
Operador: is in
Valor: CN, RU, KP
Ação: Block
```

**Rate limiting por IP**:
```
Campo: (http.request.uri.path contains "/api/auth")
Ação: Rate Limit
Limite: 10 req/minuto por IP
```

**Bloquear bots conhecidos** (já automático no plano gratuito via Bot Fight Mode):
- **Security → Bots → Bot Fight Mode**: ON

### 7. Performance

**Speed → Optimization**:
- **Auto Minify**: HTML ✓, CSS ✓, JS ✓
- **Brotli**: ON ✓
- **Rocket Loader**: teste — pode quebrar alguns scripts

**Caching → Configuration**:
- **Caching Level**: Standard
- **Browser Cache TTL**: 4 hours

**Page Rules** (usar para paths estáticos):
```
Padrão: meuapp.com.br/assets/*
Cache Level: Cache Everything
Edge Cache TTL: 1 month
```

### 8. Cloudflare Workers (funções serverless)

Gratuito até 100.000 req/dia:

```javascript
// worker.js
export default {
  async fetch(request) {
    const url = new URL(request.url)
    
    // Redirecionar /app/* para Vercel
    if (url.pathname.startsWith('/app')) {
      return fetch(`https://meuapp.vercel.app${url.pathname}`)
    }
    
    // Redirecionar /api/* para Render
    if (url.pathname.startsWith('/api')) {
      return fetch(`https://meu-backend.onrender.com${url.pathname}`)
    }
    
    return new Response('Not found', { status: 404 })
  }
}
```

Deploy via CLI:
```bash
npm install -g wrangler
wrangler login
wrangler deploy
```

### 9. R2 Storage (S3 compatível, gratuito)

Para armazenar arquivos (imagens, PDFs, etc.) sem custo:

1. **R2 → Create Bucket**
2. Nome do bucket: `meuapp-uploads`
3. Configure domínio customizado: `cdn.meuapp.com.br`

```bash
# SDK AWS (compatível com R2)
npm install @aws-sdk/client-s3

# Configurar
const client = new S3Client({
  region: 'auto',
  endpoint: `https://${ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY,
    secretAccessKey: R2_SECRET_KEY,
  },
})
```

## Checklist pós-configuração

- [ ] Nameservers atualizados no registrador
- [ ] SSL modo Full (strict) habilitado
- [ ] Always Use HTTPS habilitado
- [ ] Registros DNS do Vercel/Render/Supabase adicionados
- [ ] Email Routing configurado
- [ ] Bot Fight Mode ativado
- [ ] Status page apontando para UptimeRobot
- [ ] Auto Minify habilitado

## Quando migrar para o Pro ($20/mês)

- Mais de 5 regras de firewall
- Analytics detalhado com dados de países/dispositivos
- Image Resizing automático
- Suporte a Workers KV com mais limites
- Para a grande maioria dos SaaS, o plano gratuito é suficiente indefinidamente
