# Estado Atual — Fábrica de SaaS

> Atualizado em: 2026-06-23

## Projeto ativo: Enemeop Flores

### Sessão 2026-06-23 — O que foi feito

#### WhatsApp Bot (webhook-whatsapp)

1. **Tabela `conversas` criada** — era o root cause de tudo não funcionar ✅
2. **webhook-whatsapp v7 deployado** com:
   - `verify_jwt: false` (Z-API não manda JWT — NUNCA deployar com true)
   - Catálogo corrigido: apenas códigos reais do banco (removidos ~30 códigos inventados como M28, 051, etc.)
   - Normalização de telefone: números sem `55` recebem o prefixo automaticamente
   - Integração de frete: detecta CEP na mensagem → chama `logistica` → injeta cotação no contexto da IA
   - System prompt: entrega NUNCA é gratuita; fotos automáticas com códigos; sem mencionar ligação
3. **JWT bug resolvido** — v3 e v4 deployaram com `verify_jwt: true` quebrando tudo. Corrigido na v5+
4. **Foto dos produtos** — sistema funciona quando IA inclui código; catálogo corrigido garante códigos válidos
5. **Multi-cliente** — sistema atende múltiplos clientes simultaneamente via tabela `conversas` por (canal_id, canal)

#### Números WhatsApp
- **Bot (Z-API): `5511912808282`** — clientes mandam mensagem aqui para falar com Flor (bot)
- **Site/humano: `5511982829083`** — NÃO TOCAR, outro sistema já configurado no site

#### Pendentes
- [ ] Confirmar cotação Lalamove funcionando para CEPs de SP (integrado mas não testado com sucesso ainda)
- [ ] Corrigir coordenadas de origem no `lalamove.ts` (ainda usa defaults de Aracaju em vez de Ipiranga SP)
- [ ] Corrigir bug de login em `enemeop-flores.vercel.app`
- [ ] Renovação do token Instagram (~60 dias)
- [ ] Divulgar número do bot (91280-8282) nos canais de marketing

---

### Infraestrutura em produção

| Componente | URL/Info | Status |
|---|---|---|
| App (painel admin) | https://enemeop-flores-three.vercel.app | ✅ Online |
| Supabase | https://gftnjvdvzgjkhwxnxnwl.supabase.co | ✅ Ativo |
| Webhook WhatsApp | `webhook-whatsapp` v7, verify_jwt: false | ✅ Funcional |
| Webhook Instagram | `webhook-meta` | ✅ Ativo |
| Pipeline leads | DM Instagram/WhatsApp → Supabase | ✅ Funcional |
| Bot WhatsApp | número 5511912808282 via Z-API | ✅ Respondendo |
| Lalamove (frete) | Integrado no webhook-whatsapp v7 | ⚠️ Integrado, cotação SP não confirmada |

---

### Credenciais Z-API (Enemeop Flores)

| Credencial | Valor |
|---|---|
| ZAPI_INSTANCE_ID | 3F4B4EBCBF57819B4C199EBEB687E09D |
| ZAPI_TOKEN | 23A3BBB9EBFED71EB53E773B |
| ZAPI_CLIENT_TOKEN | F85b5a2e44844413db35105bfc68493d1S |
| Número conectado | 5511912808282 |
| Webhook configurado | https://gftnjvdvzgjkhwxnxnwl.supabase.co/functions/v1/webhook-whatsapp |

---

### Próximo passo imediato

1. Testar cotação de frete: mandar mensagem com CEP para o bot e verificar se Lalamove retorna valor correto
2. Se não funcionar: checar coordenadas de origem no `lalamove.ts` (mudar de Aracaju para Ipiranga SP: lat -23.5906, lng -46.6070)
3. Após frete funcionando: corrigir bug de login no painel admin
