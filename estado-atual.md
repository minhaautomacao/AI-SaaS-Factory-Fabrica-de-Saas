# Estado Atual — Fábrica de SaaS

> Atualizado em: 2026-06-27

## Projeto ativo: Enemeop Flores

---

## O que está PRONTO e FUNCIONANDO

### Pipeline WhatsApp (Z-API) ✅
```
Cliente → WhatsApp 5511912808282 → Z-API → Orquestrador (Render) → Flora IA (Groq) → Z-API → Cliente
```
- Agente Flora responde automaticamente com catálogo real de produtos
- Detecta CEP na mensagem e integra cotação de frete (Lalamove)
- Histórico salvo no Redis (TTL 3 dias)
- Escalada para Carlos quando cliente pede atendente humano
- Multi-cliente simultâneo via tabela `conversas`

### Pipeline Instagram (webhook-meta) ✅
```
DM Instagram → Meta Webhook → webhook-meta v23 (Supabase) → Orquestrador → Flora IA → Graph API v21.0 → DM reply
```
- App Meta em modo Live e publicado
- IA reinicia conversa quando recebe nova mensagem após conclusão
- Token Instagram válido até ~2026-08-01

### Infraestrutura em produção

| Componente | URL/Info | Status |
|---|---|---|
| App painel admin | https://enemeop-flores-three.vercel.app | ✅ Online |
| Supabase Enemeop | gftnjvdvzgjkhwxnxnwl.supabase.co | ✅ Ativo |
| Orquestrador | enemeop-orchestrator.onrender.com | ✅ Online |
| WhatsApp Z-API | Instância "Enemeop Flores" | ✅ Respondendo |
| Webhook WhatsApp | webhook-whatsapp v7, verify_jwt: false | ✅ Funcional |
| Webhook Instagram | webhook-meta v23 | ✅ Ativo |
| Keep-alive Render | GitHub Actions (keep-render-alive.yml) | ✅ Ativo |

### Fábrica de SaaS — Infra

| Componente | URL/Info | Status |
|---|---|---|
| Supabase fábrica | ebeapnydeiwuewxatuuw.supabase.co | ✅ Ativo |
| Orquestrador BullMQ | Upstash Redis + Render | ✅ Configurado |
| Skills CLI | /novo-saas, /setup-auth, /criar-pagina, /checklist-deploy | ✅ Prontos |

---

## Pendências abertas

| # | Problema | Impacto | Status |
|---|---|---|---|
| 1 | Cotação Lalamove SP não confirmada | Frete pode estar errado | Testar com CEP SP |
| 2 | Coordenadas origem no lalamove.ts | Ainda usa defaults de Aracaju | Corrigir para Ipiranga SP: -23.5906, -46.6070 |
| 3 | Bug de login em enemeop-flores.vercel.app | Admin não consegue logar | Pendente |
| 4 | CNAME app.enemeopflores.com.br | Domínio customizado offline | Aguarda usuário configurar Cloudflare |
| 5 | Bug REQUER_ESCALADA em orquestrador.ts:38-43 | Leads não escalam para atendente | Pendente |
| 6 | WhatsApp SDR (resposta automática leads Instagram) | Sem resposta automática no WA | Em planejamento |
| 7 | Token Instagram expira ~2026-08-01 | Pipeline offline após data | Monitorar |
| 8 | Divulgar número do bot (91280-8282) | Clientes não sabem que existe | Ação de marketing |

---

## Credenciais — localização

| Credencial | Localização |
|---|---|
| Z-API (INSTANCE_ID, TOKEN, CLIENT_TOKEN) | Variáveis de ambiente no Render |
| Meta App Secret / Tokens | `.credentials/meta/.env` |
| Supabase Access Token CLI | `.credentials/infraestrutura/.env` |
| WhatsApp bot | 5511912808282 |
| WhatsApp site/humano | 5511982829083 (NÃO TOCAR) |
| Instagram ID @enemeopflores | 17841402064363907 |
| Facebook Page ID | 350648311678163 |
| Meta App ID | 512230540723061 |

---

## Próximo passo recomendado

1. Testar frete: mandar mensagem com CEP de SP para o bot e verificar cotação Lalamove
2. Se errada: corrigir coordenadas em `orchestrator/src/lib/lalamove.ts` (lat -23.5906, lng -46.6070)
3. Corrigir bug de login no painel admin
