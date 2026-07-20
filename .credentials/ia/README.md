# Credenciais IA — GPT Advisor (Fábrica de SaaS)

> **NUNCA commitar o arquivo `.env` desta pasta.** Apenas este README é versionado.

Crie o arquivo `.env` local aqui com o valor real.

---

## Credencial

```env
# OpenAI API Key — para o GPT Advisor (docs/GPT_ADVISOR_RULES.md)
# Obter em: https://platform.openai.com/api-keys
# Preferir uma Project API Key com escopo restrito, não a chave de conta inteira.
OPENAI_API_KEY=
```

---

## Onde é usada

- `ai/advisor.ts` — lê via `dotenv.config({ path: '.credentials/ia/.env' })`, usada **somente** no header `Authorization` da chamada à OpenAI. Nunca é enviada no conteúdo do prompt, nunca logada, nunca impressa.

## Renovação

Chaves de API da OpenAI não expiram automaticamente, mas seguem a regra geral do projeto de rotação recomendada a cada 90 dias (ver `CLAUDE.md`).
