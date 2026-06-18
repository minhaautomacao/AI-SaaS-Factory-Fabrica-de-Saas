# SESSION STATE — Fábrica de SaaS

> Fonte de verdade do estado atual. Atualizar a cada CHECKPOINT.
> Máx. 60 linhas. Se crescer além disso, arquivar em CHANGELOG_AGENT.md.

---

## Status geral

| Campo | Valor |
|---|---|
| Data deste snapshot | 2026-06-18 |
| Fase atual | Fase 8 — Execução pós-produção |
| Branch fábrica | main |
| Branch enemeop | master |
| Pipeline Instagram | PRODUÇÃO — funcional |

---

## Última tarefa concluída

**2026-06-18** — MCP Markitdown instalado e padronizado
- Adicionado `markitdown-mcp-npx` ao .claude/settings.json
- Regra adicionada ao CLAUDE.md: usar `mcp__markitdown__*` para leitura de qualquer arquivo enviado na conversa
- Ativa na próxima sessão (requer reinício do Claude Code)

## Tarefa em andamento

Nenhuma. Aguardando próxima instrução.

## Próximo passo objetivo

1. **CNAME Cloudflare** — usuário adiciona `app CNAME cname.vercel-dns.com` no painel Cloudflare
2. **Z-API WhatsApp SDR** — integrar resposta automática para leads do Instagram
3. **Renovar token Instagram** — prazo 2026-08-01

---

## Problemas abertos

| # | Problema | Impacto | Status |
|---|---|---|---|
| 1 | CNAME `app.enemeopflores.com.br` não configurado | Domínio customizado offline | Aguarda usuário |
| 2 | Bug REQUER_ESCALADA em orquestrador.ts:38-43 | Leads não escalam para atendente | Pendente |
| 3 | WhatsApp SDR não implementado | Sem resposta automática | Em planejamento |
| 4 | Token Instagram expira 2026-08-01 | Pipeline offline após data | Monitorar |

---

## MCPs esperados nesta sessão

| MCP | Status esperado | Verificar se ausente |
|---|---|---|
| Playwright (`mcp__playwright__*`) | Connected | Reiniciar sessão |
| Vercel (`mcp__a0c23722-*`) | Connected | Checar .claude/settings.json |
| Supabase (`mcp__a7729ab9-*`) | Connected | Checar .claude/settings.json |
| Markitdown (`mcp__markitdown__*`) | Connected | Verificar Python 3.10+ instalado |

---

## Infraestrutura crítica

| Serviço | URL / ID | Status |
|---|---|---|
| Enemeop Flores (Vercel) | enemeop-flores-three.vercel.app | Online |
| Supabase enemeop | gftnjvdvzgjkhwxnxnwl | Online |
| Supabase fábrica | ebeapnydeiwuewxatuuw | Online |
| Orquestrador (Render) | enemeop-orchestrator.onrender.com | Online (keep-alive via GitHub Actions) |
| Webhook Meta | /functions/v1/webhook-meta | Ativo |

---

## Último status Git conhecido

```
Repositório: AI-SaaS-Factory-Fabrica-de-Saas
Branch: main | Último commit: 65f2778
Status: limpo (sem alterações pendentes)
Sincronizado com: github.com/minhaautomacao/AI-SaaS-Factory-Fabrica-de-Saas
```
