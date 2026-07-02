# CURRENT STATE — fonte única de retomada

> Ler ESTE arquivo primeiro em toda retomada. Não fazer auditoria completa sem pedido explícito.
> Atualizar sempre que o próximo passo mudar.

---

## Missão atual

**MISSÃO M002 — Fazer a Flora responder DM real no Instagram.**

Nenhuma funcionalidade nova do painel será desenvolvida antes de concluir a integração Meta.

---

## Estado já conhecido

```
Meta entrega webhook         ✅
Webhook recebe POST          ✅
HMAC valida (dual secret)    ✅  (META_IG_APP_SECRET + META_APP_SECRET)
Flora executa                ✅
Captação executa             ✅
Orquestrador executa         ✅
META_INSTAGRAM_ID no secret  ✅  (corrigido 01/07/2026 01:26 UTC)
webhook-meta v22 ativa       ✅  (já loga status/endpoint/corpo do erro da Graph API + diag-token)
Endpoint Graph API correto   ✅  (endpoint=ig, confirmado no log)
Token novo gerado e salvo    ✅  (01/07/2026 22:46 UTC, via fluxo correto Instagram Business Login)
Resposta aparece no Direct   ❌  BLOQUEADO — mesmo erro 190 com token novo (ver causa raiz abaixo)
```

## Causa raiz — hipótese de token malformado DESCARTADA (01/07/2026, teste real)

Gerado token novo pelo fluxo correto: Meta Dashboard → app `enemeopflores` → Casos de uso → API do Instagram → Configuração da API com login do Instagram → conta `enemeopflores` / Instagram ID `17841402064363907` → "Gerar token". Salvo em `META_IG_ACCESS_TOKEN` (Supabase Secrets) às 01/07/2026 22:46:20 UTC (confirmado por toast de sucesso + mudança de digest SHA256).

Teste de DM real "teste" repetido → **mesmo erro**:
```
ERROR [webhook-meta] erro DM status=400 endpoint=ig
corpo={"error":{"message":"Invalid OAuth access token - Cannot parse access token","type":"OAuthException","code":190,"fbtrace_id":"AeO8Snks5_RnxxCSoDsgD9P"}}
INFO [diag-token] igTokenPresente=true length=183 trimLength=183 leadingWhitespace=false trailingWhitespace=false hasQuote=false hasNewline=false looksLikeJson=false igIdPresente=true igIdUsado=true endpointUsado=ig
```
Token limpo (sem espaço/aspas/quebra de linha/JSON), do app e fluxo corretos — **isso descarta de vez a hipótese de token malformado**. Host usado: `graph.facebook.com`, versão `v21.0`, endpoint `/{META_INSTAGRAM_ID}/messages`.

## Duas frentes abertas para o erro 190 (nenhuma aplicada ainda)

**Frente A — Testador do Instagram não confirmado (em investigação, prioridade atual):**
- Meta Dashboard → Funções do app → mostra **"Testadores: 0 de 500"**; `enemeopflores` e `instacarlosron` aparecem como "Testador do Instagram" com status "Carregando..." (convite pendente, não confirmado). Seção "5. Concluir a análise do app" (App Review) sem selo de concluído.
- **Porém**, em `instagram.com/accounts/manage_access/` (logado como @enemeopflores), aba "Ativos", o app `enemeopflores-IG` já aparece **autorizado em 1 de julho de 2026** — parece contradizer a leitura de "pendente".
- **Ainda não verificado:** aba "Convites do testador" nesse mesmo painel do Instagram — a sessão do Playwright caiu antes de checar. **Este é o próximo passo exato.**

**Frente B — Host errado no código (diff preparado, PAUSADO, não aplicado/deployado):**
- Doc oficial da Meta confirma: Instagram API with Instagram Login exige host `graph.instagram.com` (não `graph.facebook.com`) para o Instagram User Access Token.
- Diff proposto (não aplicado): em `processarDM`, trocar `https://graph.facebook.com/v21.0/${igId}/messages` → `https://graph.instagram.com/v21.0/${igId}/messages` (só no ramo `isInstagram`; ramo Facebook/Messenger não muda).
- **Decisão de Carlos:** validar Frente A primeiro. Só retomar este diff se o erro persistir após confirmar o testador.

## Achado paralelo — repositório local dessincronizado (não bloqueia, mas é risco)

`supabase/functions/webhook-meta/index.ts` no repositório local está com **conflito de merge não resolvido** (marcadores literais `<<<<<<< HEAD` / `=======` / `>>>>>>>` + função `processarComentario` duplicada). Comparado via `get_edge_function`, a versão realmente implantada (v22) está limpa e é diferente do arquivo local. **Antes de qualquer deploy futuro da `webhook-meta`, é obrigatório primeiro sincronizar o arquivo local com a versão limpa implantada** — não usar o arquivo local como está.

---

## Próximo passo exato (retomar amanhã)

1. Reabrir Playwright, navegar para `https://www.instagram.com/accounts/manage_access/` (já logado como @enemeopflores) → aba **"Convites do testador"** → conferir se há convite pendente distinto do que já aparece em "Ativos".
2. Se houver convite pendente: Carlos aceita.
3. Voltar ao Meta Dashboard (`Funções do app`) e confirmar se o testador aparece confirmado (sai de "0 de 500", status deixa de ser "Carregando...").
4. Pedir novo teste real: DM "teste" para @enemeopflores.
5. Verificar logs de `webhook-meta`: `https://supabase.com/dashboard/project/gftnjvdvzgjkhwxnxnwl/functions/webhook-meta/logs` (POST recebido, endpoint, status HTTP, corpo da resposta, se chegou no Direct).
6. **Se resolver:** atualizar este arquivo + `KNOWN_ISSUES.md` + `DECISIONS.md` com a solução definitiva, encerrar MISSÃO M002.
7. **Se persistir o erro 190:** retomar a Frente B (diff de host, já preparado acima) — aplicar só com aprovação explícita antes de deploy, e antes disso sincronizar o arquivo local (achado paralelo acima).

### Nota técnica — como ler os logs de execução
`mcp__supabase__get_logs` (service=edge-function) só retorna logs de gateway (método/status HTTP), não console.log/error da função. Para ver o erro real da Graph API, usar Playwright MCP navegando direto para a URL de logs acima.

---

## GPT Advisor (frente pausada)

```
Status:              pausado
Motivo:              OpenAI API retornou 429 insufficient_quota
Próxima ação futura: habilitar billing/créditos da OpenAI e repetir teste de conexão
Código:              validado parcialmente (ai/advisor.ts + ai/sanitize.ts + ai/prompt.ts + scripts/gpt-advisor.ts)
Chave:               carregada corretamente de .credentials/ia/.env (comprimento 164, prefixo sk-)
Produção:            nenhuma alteração
Secrets expostos:    nenhum
```

Ver `docs/GPT_ADVISOR_RULES.md`. Não reabrir esta frente sem pedido explícito.

---

## Pendências conhecidas (não bloqueiam a missão atual)

- Deploy de 3 commits do orquestrador pendente no Render (não é blocker do M002)
- Vercel MCP conectado na conta errada ("Essencial Auto Peças") — não usar até trocar
- Token Instagram expira 2026-08-01
