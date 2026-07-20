# GPT Advisor — Regras

Ferramenta local de diagnóstico e arquitetura consultiva. Lê `docs/CURRENT_STATE.md`, recebe um erro/log, consulta a OpenAI e devolve um diagnóstico estruturado. **Nunca executa alterações.**

## Arquitetura

```
Cloud Code → logs → sanitização → resumo do CURRENT_STATE.md → pergunta objetiva
→ OpenAI GPT Advisor → resposta estruturada (JSON) → Cloud Code interpreta
→ Carlos aprova → Cloud Code executa
```

## Papéis

| | GPT Advisor | Cloud Code | Carlos |
|---|---|---|---|
| Arquitetura, diagnóstico, revisão, sugestões | ✔ | | |
| Código, testes, deploy, git, commits, produção | | ✔ | |
| Aprova alterações, autoriza deploy/token, autentica na Meta | | | ✔ |
| Deploy / git / secrets / produção | ✘ | | |

## Protocolo de consulta

Consultar o GPT Advisor apenas quando: erro inesperado, dúvida arquitetural, conflito técnico, análise de logs, ou revisão de implementação. **Não consultar para tarefas triviais** — cada chamada tem custo.

## Regras de segurança (obrigatórias)

1. **Nunca enviar secrets, tokens ou credenciais** no conteúdo do prompt — nem de `.credentials/**`, nem de `.env`, nem valores reais de variáveis de ambiente.
2. `OPENAI_API_KEY` é usada **somente** no header `Authorization` da chamada HTTP para autenticar contra a própria OpenAI — nunca é incluída no texto do prompt/input enviado ao modelo, nunca impressa, nunca logada, nunca commitada.
3. **Sempre sanitizar** (`ai/sanitize.ts`) o erro/log e o resumo do `CURRENT_STATE.md` antes de qualquer chamada. Nunca enviar, em texto bruto:
   - conteúdo de `.env` (linhas `CHAVE=valor`)
   - secrets (`secret=...`, `senha=...`)
   - tokens (Facebook/Instagram/Page com prefixo `EAA`, OpenAI `sk-...`, e qualquer sequência alfanumérica de 32+ caracteres)
   - header `Authorization`
   - `Bearer <token>`
   - `Cookie` / `Set-Cookie`
   - JWT (qualquer string no formato `eyJ....eyJ....`)
   - IDs longos sensíveis (15+ dígitos — IDs da Meta)
4. **Contexto mínimo** — só o trecho relevante do log/erro + resumo curto do `CURRENT_STATE.md` (primeiros ~1500 caracteres). Nunca o repositório inteiro, nunca centenas de arquivos.
5. **Nunca ler `.credentials/` para enviar conteúdo** — a única leitura permitida ali é a própria `OPENAI_API_KEY` em `.credentials/ia/.env`, usada só como credencial de autenticação (regra 2).
6. **Nunca solicitar geração automática de código** — a resposta é diagnóstico e sugestão, não implementação.
7. Toda decisão sensível (deploy, geração de token, alteração de secret, produção) continua exigindo aprovação humana explícita, independente do que o advisor sugerir.

## Contexto enviado (exemplo)

```
Projeto:
[nome-do-workspace]

Estado:
Instagram recebe webhook
Agente de SDR executa
Erro atual:
Graph API OAuthException 190

Erro:
[trecho sanitizado]

Pergunta:
Qual é a próxima ação técnica única recomendada?
```

## Formato de resposta

Sempre solicitado em JSON estruturado (Responses API, `text.format.type = json_schema`, `strict: true`):

```json
{
  "diagnostico": "...",
  "causaProvavel": "...",
  "nivelConfianca": 0.00,
  "proximaAcao": "...",
  "precisaDeploy": false,
  "precisaNovoToken": false,
  "precisaAcaoHumana": true,
  "justificativa": "..."
}
```

## Nível de confiança

Quando o Advisor devolver `nivelConfianca` inferior a **0.80**: não executar nenhuma ação automaticamente com base na resposta — coletar mais evidência primeiro (mais logs, mais contexto) e só então reconsultar ou decidir.

## Fluxo operacional

```
Cloud Code
  ↓
sanitize()
  ↓
CURRENT_STATE resumo
  ↓
OpenAI
  ↓
JSON
  ↓
Carlos
  ↓
execução
```

## Onde configurar a chave

`OPENAI_API_KEY` fica em `.credentials/ia/.env` (nunca em `.env` versionado, nunca em `.env.example` com valor real, nunca commitada). Ver `.credentials/ia/README.md`.

## Uso

```powershell
npx tsx scripts/gpt-advisor.ts "webhook-meta erro DM status=400 code=190 Cannot parse access token"
```

## Protocolo de memória

Ao final de toda sessão relevante, atualizar:
- `docs/CURRENT_STATE.md` — onde parou, última tarefa/teste/deploy/commit, próximo passo exato
- `docs/DECISIONS.md` — decisões definitivas novas (nunca remover entradas antigas)
- `docs/KNOWN_ISSUES.md` — problemas confirmados com evidência (remover quando resolvido)
- `docs/ROADMAP.md` — só prioridades ativas; tarefa concluída sai daqui

## Regras permanentes

- Nunca gerar token por tentativa
- Nunca alterar produção sem aprovação
- Nunca alterar webhook sem evidência
- Nunca alterar código baseado em hipótese
- Nunca responder com "acho" / "provavelmente" / "deve ser" — toda conclusão exige evidência objetiva; sem evidência suficiente, interromper, coletar dados, confirmar, e só depois concluir
