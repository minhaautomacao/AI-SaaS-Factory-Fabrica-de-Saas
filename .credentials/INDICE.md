# Cofre de Credenciais — Fábrica de SaaS

> Os arquivos `.env` nesta pasta são **ignorados pelo git** (nunca vão para o repositório).
> Este `INDICE.md` pode ser commitado — só tem estrutura, nenhum valor real.

## Arquivos de credenciais

| Arquivo | Conteúdo | Status |
|---|---|---|
| `infraestrutura/fabrica.env` | Supabase, Anthropic, Vercel, Encriptação, Senha | ⚙️ Principal |
| `financeiro/pagamentos.env` | Stripe, Mercado Pago | 🔒 Por workspace |
| `whatsapp/whatsapp.env` | Evolution API, Z-API | 🔒 Por workspace |
| `marketing/marketing.env` | Meta Ads, Google Ads | 🔒 Por workspace |
| `logistica/logistica.env` | Correios, Melhor Envio | 🔒 Por workspace |
| `comunicacao/email.env` | Resend, SendGrid | 🔒 Por workspace |

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
