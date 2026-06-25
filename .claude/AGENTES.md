# Protocolo de Colaboração Multiagente

## Agentes e responsabilidades

### Claude Code — Construtor principal

- Definir e manter a arquitetura técnica
- Implementar funcionalidades
- Criar e executar migrations de banco
- Corrigir bugs
- Preparar e executar deploys
- Manter consistência técnica do projeto

**Não faz:** testar fluxos em produção após deploy, validar UX do ponto de vista do cliente.

---

### Antigravity — Auditor externo

- Revisar código implementado pelo Claude Code
- Testar fluxos e identificar regressões
- Apontar bugs, riscos de segurança, problemas de performance e UX
- Sugerir correções com contexto técnico claro
- Fazer pequenas correções apenas quando autorizado pelo ChatGPT

**Não faz:** liderar arquitetura, alterar banco, criar migrations, fazer deploy sem aprovação explícita.

---

### ChatGPT — Orquestrador operacional

- Receber objetivos de Carlos e traduzi-los em tarefas concretas
- Enviar prompts claros para Claude Code e Antigravity
- Verificar se o que foi implementado está alinhado com as premissas do projeto
- Decidir quando acionar o Antigravity para auditoria
- Transformar relatórios de auditoria em instruções objetivas para Claude Code
- Priorizar próximos passos

**Não faz:** implementar código diretamente, definir arquitetura técnica.

---

### Carlos — Operador humano

- Informar objetivos ao ChatGPT
- Executar comandos aprovados
- Copiar respostas entre ferramentas
- Aprovar ações antes da execução
- Trazer resultados de volta ao ChatGPT

**Não precisa decidir:** arquitetura, prioridade técnica ou estratégia de correção.

---

## Fluxo operacional padrão

```
1. Carlos informa objetivo → ChatGPT
2. ChatGPT define escopo e envia prompt → Claude Code
3. Claude Code implementa e entrega resultado
4. Carlos traz resultado → ChatGPT
5. ChatGPT verifica aderência ao projeto
6. ChatGPT decide se aciona Antigravity
7. [se sim] Antigravity audita e entrega relatório
8. Carlos traz relatório → ChatGPT
9. ChatGPT transforma relatório em instruções → Claude Code
10. Claude Code corrige, commita e faz deploy
```

---

## Convenção de commits

| Prefixo | Usado por | Exemplo |
|---|---|---|
| `feat:` | Claude Code | `feat: adiciona cotação MOTORCYCLE no agente-logistica` |
| `fix:` | Claude Code | `fix: corrige double-confirm no webhook-whatsapp` |
| `deploy:` | Claude Code | `deploy: webhook-whatsapp v28 → gftnjvdvzgjkhwxnxnwl` |
| `refactor:` | Claude Code | `refactor: extrai helper cotarServico em lalamove.ts` |
| `audit:` | Antigravity | `audit: revisão webhook-whatsapp v28 — 3 issues` |
| `fix(audit):` | Antigravity (autorizado) | `fix(audit): corrige regex textoConfirmacao` |
| `plan:` | via Carlos | `plan: define escopo fase 9 — tela de pedidos` |
| `chore:` | qualquer | `chore: atualiza estado-atual.md` |

---

## Arquivos com dono exclusivo

Estes arquivos nunca devem ser editados simultaneamente por agentes diferentes:

| Arquivo | Dono exclusivo | Motivo |
|---|---|---|
| `supabase/functions/webhook-whatsapp/index.ts` | Claude Code | Deploy contínuo — conflito quebra produção |
| `supabase/functions/agente-logistica/index.ts` | Claude Code | Idem |
| `supabase/functions/_shared/*.ts` | Claude Code | Compartilhado por múltiplas funções |
| `supabase/migrations/*.sql` | Claude Code | Ordem de migration é crítica e irreversível |
| `.claude/memory/*.md` | Claude Code | Memória de sessão — sobrescrita causa perda de contexto |
| `.claude/estado-atual.md` | Claude Code (escreve) | Único ponto de verdade do projeto |

O Antigravity **não edita** esses arquivos diretamente. Propõe correções no relatório de auditoria; Claude Code aplica.

---

## Pontos onde auditoria faz sentido

```
Implementação (Claude Code)
  → [AUDIT 1] Antes de merge em dev
      Antigravity: revisão de código, lógica, edge cases

  → Merge em dev
  → [AUDIT 2] Antes de deploy em produção
      Antigravity: teste de integração, regressão, segurança

  → Deploy em main
  → [AUDIT 3] Pós-deploy (quando há interação real)
      Antigravity: validação de logs, UX do fluxo WhatsApp
```

---

## Estrutura de branches

```
main          ← produção (Claude Code faz merge)
  └── dev     ← integração
        ├── feature/*   ← implementação (Claude Code)
        └── audit/*     ← auditoria (Antigravity, deriva de feature/*)
```

---

## Relatórios de auditoria

Salvos em: `.claude/audits/YYYYMMDD-nome-da-feature.md`

Use o template em `.claude/audits/TEMPLATE-AUDITORIA.md`.
