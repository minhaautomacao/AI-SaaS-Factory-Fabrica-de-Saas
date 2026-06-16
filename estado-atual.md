# Estado Atual — Fábrica de SaaS

> Atualizado em: 2026-06-16 (noite)

## Projeto ativo: Enemeop Flores

### Infraestrutura em produção

| Componente | URL/Info | Status |
|---|---|---|
| App (painel admin) | https://enemeop-flores-three.vercel.app | ✅ Online |
| Supabase Enemeop | https://gftnjvdvzgjkhwxnxnwl.supabase.co | ✅ Ativo |
| Webhook Meta (Flora) | webhook-meta no Supabase Fábrica (`gftnjvdvzgjkhwxnxnwl`) | ✅ Deployado |
| Pipeline Instagram | DM → webhook-meta → IA Flora → Graph API v21.0 | ✅ Funcionando |
| Orquestrador | https://enemeop-orchestrator.onrender.com | ✅ Online |
| WhatsApp Z-API | Instância "Enemeop Flores" | ✅ Conectado e respondendo |

---

## O que foi feito hoje (2026-06-16)

### Manhã — Z-API WhatsApp
- Z-API configurado com sucesso (instância "Enemeop Flores")
- Variáveis ZAPI_INSTANCE_ID, ZAPI_TOKEN, ZAPI_CLIENT_TOKEN configuradas no Render
- WhatsApp **testado e funcionando** — agente Flora responde clientes normalmente
- SDR melhorado: usa nome do cliente, salva `mensagem_inicial` e `status` no primeiro contato
- Build TS corrigido, polling BullMQ reduzido de 5ms para 30s

### Tarde/Noite — Agente Meta (Instagram/Facebook)
- `webhook-meta` atualizado com:
  - `META_PAGE_ACCESS_TOKEN` como token para envio de DMs (com fallback para IG token)
  - API Graph atualizada v19.0 → v21.0
  - Correção na extração de comentários (`val['text']` como fallback, `val['comment_id']`)
- Novo SUPABASE_ACCESS_TOKEN gerado (sem expiração) — salvo em `.credentials/infraestrutura/.env`
- Deploy realizado com sucesso

---

## Status atual do agente Meta

O `webhook-meta` está deployado e configurado para:
- Responder **DMs do Instagram** com a IA Flora (Groq llama-3.1-8b-instant)
- Responder **DMs do Facebook** (Messenger)
- Responder **comentários em posts** (Instagram e Facebook)
- Memória de conversa por fase (descoberta → interesse → proposta → pagamento → concluído)

**Pendente validar:** receber uma DM real no Instagram @enemeopflores e verificar nos logs do Supabase se a resposta foi enviada com sucesso.

---

## Próximos passos

1. **Testar DM Instagram** — mandar mensagem para @enemeopflores e verificar resposta da Flora
2. **Verificar logs** — `https://supabase.com/dashboard/project/gftnjvdvzgjkhwxnxnwl/functions/webhook-meta/logs`
3. **Upstash Redis** — o banco antigo (`legal-imp-145889`) estava com limite esgotado. Verificar se o novo (`possible-monster-149874`) está funcionando no orquestrador
4. **CARLOS_WHATSAPP** — confirmar se foi corrigido para `5511982829083` no Render

---

## Credenciais relevantes

| Credencial | Valor |
|---|---|
| Supabase Access Token CLI | ver `.credentials/infraestrutura/.env` (sem expiração) |
| Z-API Instance ID | ver `.credentials/infraestrutura/.env` |
| WhatsApp número | 5511912808282 |
| Instagram ID | 17841402064363907 (@enemeopflores) |
