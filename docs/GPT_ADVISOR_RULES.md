# GPT Advisor — Regras

Ferramenta local de diagnóstico: lê `docs/CURRENT_STATE.md` + um erro/log fornecido na linha de comando, chama a OpenAI API e devolve a próxima ação técnica sugerida. Não substitui aprovação humana e não executa nada sozinha.

## Regras obrigatórias

1. **Nunca enviar secrets, tokens ou credenciais** — nem de `.credentials/**`, nem de `.env`, nem valores reais de variáveis de ambiente.
2. **Sempre mascarar** o texto do erro/log e o trecho do `CURRENT_STATE.md` antes de qualquer chamada à API (remover sequências longas alfanuméricas, `Bearer <token>`, JWTs).
3. **Contexto mínimo** — enviar só o trecho relevante do log e um resumo curto do estado atual, nunca o repositório inteiro ou arquivos de credenciais.
4. **Nunca aprovar ou executar ações sensíveis** (deploy, geração de token, alteração de secret, push, alteração de produção) com base na resposta do advisor — a resposta é só sugestão, decisão continua sendo humana.
5. **Não ler `.credentials/`** — o script não deve abrir nem referenciar essa pasta.
6. **Registrar uso**, se relevante, em `docs/CHANGELOG_AGENT.md` quando a sugestão do advisor influenciar uma decisão real.

## Onde configurar a chave

`OPENAI_API_KEY` deve ficar em `.credentials/ia/.env` (nunca em `.env` versionado, nunca em `.env.example` com valor real). O script lê via variável de ambiente do processo — ver instruções de execução no cabeçalho de `scripts/gpt-advisor.ts`.
