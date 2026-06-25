# Auditoria: [nome-da-feature]

**Data:** YYYY-MM-DD  
**Branch auditada:** feature/nome  
**Versão/deploy:** ex. webhook-whatsapp v28  
**Auditado por:** Antigravity  
**Solicitado por:** ChatGPT  

---

## Status geral

- [ ] Aprovado — pode mergar sem alterações
- [ ] Aprovado com ressalvas — mergar após correções menores
- [ ] Reprovado — aguarda correções antes do merge

---

## Issues encontrados

### Crítico (bloqueia merge)

- [ ] `arquivo:linha` — descrição do problema e impacto

### Moderado (corrigir antes da próxima feature)

- [ ] `arquivo:linha` — descrição

### Sugestão (opcional, não bloqueia)

- descrição da melhoria sugerida

---

## Testes executados

| Cenário | Resultado |
|---|---|
| Fluxo principal | ✅ / ❌ / ⚠️ |
| Edge case: [descrever] | ✅ / ❌ / ⚠️ |
| Regressão: [feature anterior] | ✅ / ❌ / ⚠️ |

---

## Análise técnica

### Segurança
- [ ] Inputs validados nas bordas do sistema
- [ ] Sem credenciais expostas no código
- [ ] Sem SQL injection / XSS risk

### Performance
- Observações sobre queries, loops, chamadas de API

### UX (quando aplicável)
- Comportamento do bot / fluxo do cliente

---

## Correções sugeridas para Claude Code

Liste aqui as correções em formato de instrução direta, pronta para enviar ao Claude Code:

1. Em `arquivo.ts` linha X, substituir `código atual` por `código sugerido` — motivo: [...]
2. ...

---

## Decisão final

- [ ] Pode mergar — Claude Code executa merge + deploy
- [ ] Aguarda correções — Claude Code corrige e Antigravity re-audita
- [ ] Escalar para ChatGPT — decisão arquitetural necessária
