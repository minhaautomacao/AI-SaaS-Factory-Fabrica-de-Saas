# DECISIONS — Decisões definitivas do projeto

> Registrar apenas decisões já tomadas e confirmadas. Não remover entradas antigas — histórico é permanente.

## 2026-07-01 — Fluxo correto para gerar META_IG_ACCESS_TOKEN

Não usar mais Graph API Explorer para gerar `META_IG_ACCESS_TOKEN`. Usar somente o fluxo **Instagram Business Login** (Meta Dashboard → app `enemeopflores` → API do Instagram → Configuração da API com login do Instagram → conta @enemeopflores).

**Motivo:** o token anterior (Instagram User Access Token gerado via Graph API Explorer no app principal 512230540723061) não é aceito pelo endpoint `/{instagram-user-id}/messages` — a Graph API retorna `code=190 "Cannot parse access token"` mesmo com o valor bem formado (sem espaço/aspas/quebra de linha, confirmado por diagnóstico de metadados). Detalhes completos em `docs/KNOWN_ISSUES.md`.

## 2026-07-01 — Geração de tokens nunca por tentativa

Só gerar um token novo depois de comprovar objetivamente, com evidência (não hipótese), que o token atual é inválido, expirado ou do fluxo incompatível.

## 2026-07-01 — Papel permanente do GPT Advisor

O GPT Advisor nunca substitui o Cloud Code. O GPT Advisor apenas diagnostica. Toda alteração continua sendo executada exclusivamente pelo Cloud Code após aprovação humana.

## Prioridade permanente do projeto

Meta → Flora é a prioridade absoluta. Nenhuma funcionalidade nova do painel entra antes da integração Meta (Instagram + Messenger + WhatsApp via APIs oficiais) estar concluída.
