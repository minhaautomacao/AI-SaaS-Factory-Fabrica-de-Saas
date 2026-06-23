# Cofre de Credenciais — Fábrica de SaaS

> Os arquivos `.env` nesta pasta são **ignorados pelo git** (nunca vão para o repositório).
> Este `INDICE.md` pode ser commitado — só tem estrutura, nenhum valor real.

## Arquivos de credenciais

| Arquivo | Conteúdo | Status |
|---|---|---|
| `infraestrutura/fabrica.env` | Supabase, Anthropic, Vercel, Encriptação | ⚙️ Principal |
| `meta/README.md` | Instagram & Facebook — App Secret, Page Token, IDs | 🌐 Enemeop Flores |
| `whatsapp/whatsapp.env` | Evolution API, Z-API, WhatsApp Business API | 🔒 Por workspace |
| `marketing/marketing.env` | Meta Ads, Google Ads, Analytics | 🔒 Por workspace |
| `financeiro/pagamentos.env` | Stripe, Mercado Pago | 🔒 Por workspace |
| `logistica/logistica.env` | Correios, Melhor Envio | 🔒 Por workspace |
| `comunicacao/email.env` | Resend, SendGrid | 🔒 Por workspace |

---

## Status das credenciais críticas — Enemeop Flores

| Credencial | Onde está | Status |
|---|---|---|
| `META_VERIFY_TOKEN` | Supabase secrets | ✅ OK |
| `META_APP_SECRET` | Supabase secrets | ✅ OK |
| `GROQ_API_KEY` | Supabase secrets | ✅ OK |
| `FACTORY_SECRET` | Supabase secrets | ✅ OK |
| `META_PAGE_ACCESS_TOKEN` | Supabase secrets | ❌ **FALTANDO** |
| `META_PAGE_ID` | Supabase secrets | ❌ **FALTANDO** |
| `ZAPI_INSTANCE_ID` | Supabase secrets + `.credentials/whatsapp/whatsapp.env` | ✅ OK |
| `ZAPI_TOKEN` | Supabase secrets + `.credentials/whatsapp/whatsapp.env` | ✅ OK |
| `ZAPI_CLIENT_TOKEN` | Supabase secrets + `.credentials/whatsapp/whatsapp.env` | ✅ OK |

> Ver instruções completas em [`meta/README.md`](meta/README.md)

## Como usar

```bash
# Carregar credenciais da fábrica localmente
source .credentials/infraestrutura/fabrica.env

# Ou via dotenv no código
dotenv.config({ path: '.credentials/infraestrutura/fabrica.env' })
```

## Regra de segurança

- Nunca compartilhar os arquivos `.env` por email ou chat
- Backup seguro: cofre de senhas (Bitwarden, 1Password)
- Rotacionar chaves a cada 90 dias
