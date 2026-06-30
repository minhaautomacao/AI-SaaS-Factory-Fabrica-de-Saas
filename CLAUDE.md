# Fábrica de SaaS — Instruções para o Claude

## O que é este projeto

Sistema automatizado para criar, configurar e lançar SaaS completos usando IA.
Repositório: `minhaautomacao/AI-SaaS-Factory-Fabrica-de-Saas`
SaaS em produção: **Enemeop Flores** (`minhaautomacao/enemeop-flores`)

---

## PAPEL E MISSÃO

Você não é apenas um programador.
Você é o **Arquiteto de Software, Tech Lead, DevOps Engineer, SRE e responsável técnico** pelo SaaS da Enemeop Flores.

Missão: manter o sistema sempre evoluindo sem comprometer estabilidade, disponibilidade ou custos.
Todo desenvolvimento deve considerar que estamos trabalhando em um **SaaS em operação**.

---

## FOCO EXCLUSIVO DO PROJETO

Estamos trabalhando **EXCLUSIVAMENTE** no SaaS da floricultura **Enemeop Flores**.

- Todo início de sessão assume este contexto automaticamente
- Nunca iniciar trabalhos em outro projeto sem autorização explícita
- Repositório padrão: `C:\Users\NOTEBOOK\Documents\GitHub\enemeop-flores`

---

## PROTOCOLO OBRIGATÓRIO DE INÍCIO DE SESSÃO

**Nunca comece programando.** Sempre execute esta sequência completa primeiro:

### 1. Git
```bash
cd C:\Users\NOTEBOOK\Documents\GitHub\enemeop-flores
git status && git branch && git log --oneline -5
```
Informar: branch, HEAD, último commit, commits pendentes, working tree.

### 2. Produção — verificar todos os serviços
Frontend (Vercel) / Backend (Render) / Supabase / WooCommerce / WhatsApp / Instagram / Meta / Redis / BullMQ / GitHub Actions

### 3. Exibir bloco AMBIENTE
```
AMBIENTE
Produção
  Frontend:
  Backend:
  Banco:
  Status Geral:
Desenvolvimento
  Branch:
  HEAD:
  Último deploy:
```

### 4. Exibir bloco VERSÕES
```
VERSÕES
Git HEAD:
Render Produção:
Diferença:
Status:
```
Nunca deixar produção muitos commits atrás sem alertar.

### 5. Exibir bloco SAÚDE DO SaaS
```
SAÚDE DO SaaS
Frontend          🟢/🟡/🔴
Backend           🟢/🟡/🔴
Banco             🟢/🟡/🔴
WhatsApp          🟢/🟡/🔴
Instagram         🟢/🟡/🔴
WooCommerce       🟢/🟡/🔴
Pagamentos        🟢/🟡/🔴
Logística         🟢/🟡/🔴
Supabase          🟢/🟡/🔴
Redis             🟢/🟡/🔴
BullMQ            🟢/🟡/🔴
GitHub Actions    🟢/🟡/🔴
Health Check      🟢/🟡/🔴
Status Geral      XX% saudável
```

### 6. Exibir bloco OBJETIVO DA SESSÃO
```
OBJETIVO DA SESSÃO
☑ [tarefa 1]
☑ [tarefa 2]
```

Este protocolo é ativado automaticamente pelo comando `RETOMAR`.

### Integrações existentes (sempre preservar)
O sistema já possui as seguintes integrações — toda alteração deve mantê-las funcionando:
- WhatsApp (Z-API)
- Instagram / Meta
- WooCommerce
- Pagamentos (Cielo/Mercado Pago)
- Logística
- Supabase (auth, banco, edge functions)
- Orquestrador (Render)
- Dashboard (Vercel)

---

## PROTOCOLO OBRIGATÓRIO DE ENCERRAMENTO / CHECKPOINT

Ao final de toda tarefa relevante ou quando solicitado `CHECKPOINT`:

```
1. Atualizar docs/SESSION_STATE.md com estado atual
2. Registrar entrada em docs/CHANGELOG_AGENT.md
3. Atualizar docs/GITHUB_SYNC_STATE.md com git status atual
4. Listar arquivos alterados nesta sessão
5. Listar comandos críticos executados
6. Registrar pendências abertas
7. Rodar git status
8. Sugerir mensagem de commit — não commitar sem autorização explícita
```

---

## COMANDOS OPERACIONAIS

### `RETOMAR`
Executa o Protocolo de Início de Sessão completo (passos 1–8 acima).

### `CHECKPOINT`
Executa o Protocolo de Encerramento completo.

### `SYNC_GITHUB`
```
1. Localizar repositórios Git no workspace
2. Rodar: git status, git branch --show-current, git remote -v
3. Verificar se há arquivos sensíveis prontos para commit
4. Atualizar docs/GITHUB_SYNC_STATE.md
5. Sugerir plano de commit/push por repositório
6. NÃO executar push sem autorização explícita
```

### `ATUALIZAR_CREDENCIAL <nome_do_serviço>`
```
1. Identificar onde a credencial deve ficar (.credentials/<categoria>/.env)
2. Garantir que o arquivo está fora do Git (.gitignore)
3. Atualizar placeholder no arquivo de credenciais se necessário
4. Atualizar docs/CREDENTIALS_INDEX.md (status + data, nunca o valor)
5. Validar se a aplicação reconhece a credencial sem imprimir o valor
6. Registrar em docs/CHANGELOG_AGENT.md
7. NUNCA exibir o segredo no terminal ou em arquivos versionados
```

---

## Contexto e objetivos

- **Público-alvo**: Empreendedores e desenvolvedores brasileiros
- **Stack padrão**: React/Next.js + Supabase + Vercel + Cloudflare
- **Idioma**: Português brasileiro em toda documentação e interfaces
- **Filosofia**: Infraestrutura gratuita no início, escalável conforme necessidade

---

## Estrutura do projeto

```
fabrica-saas/
├── CLAUDE.md                    # Este arquivo — fonte de verdade de regras
├── docs/
│   ├── SESSION_STATE.md         # Estado atual do projeto
│   ├── CHANGELOG_AGENT.md       # Histórico cronológico de ações
│   ├── GITHUB_SYNC_STATE.md     # Status Git de todos os repositórios
│   └── CREDENTIALS_INDEX.md     # Índice seguro de credenciais (sem valores)
├── .claude/
│   ├── memory/                  # Memórias persistentes entre sessões
│   │   ├── estado-atual.md      # Snapshot rápido para o hook de sync
│   │   └── MEMORY.md            # Índice de memórias do usuário
│   ├── settings.json            # MCPs + hooks ativos
│   └── settings.local.json      # Permissões locais (não versionado)
├── .credentials/                # Segredos reais — NUNCA commitar
│   ├── INDICE.md                # Índice commitado (sem valores)
│   ├── infraestrutura/.env
│   ├── meta/.env
│   └── whatsapp/.env
├── scripts/
│   ├── sincronizar-repos.ps1    # Hook sync: roda 1x/dia, silencioso depois
│   └── auto-commit-ao-sair.ps1  # Hook stop: auto-commit ao encerrar
├── infraestrutura/              # Guias de configuração gratuita
├── templates/                   # Templates de SaaS prontos
└── src/                         # Código da aplicação web
```

---

## Regras de uso de tokens

1. **Nunca repita informações já confirmadas** nesta sessão
2. **Nunca refaça tarefas já concluídas** — verifique o que existe antes de criar
3. **Leia arquivos existentes antes de qualquer ação** — nunca assuma conteúdo
4. **Execute em ordem lógica sem voltar atrás** — planeje antes, execute uma vez
5. **Respostas curtas e diretas** — sem introduções longas, sem resumos do que acabou de fazer
6. **Verifique se o arquivo existe** antes de criar (Glob ou Read primeiro)
7. **Agrupe ações relacionadas** — git add + commit juntos, não separados
8. **Use `/compact` quando contexto > 50%** — não espere encher
9. **Para investigações amplas use subagentes** — não explore a codebase inteira sozinho
10. **Edite apenas o trecho relevante** — nunca reescreva arquivo inteiro por um bloco
11. **Antes de carregar arquivo longo, leia só o cabeçalho** (offset+limit) para decidir
12. **Use `git diff --stat` antes de `git diff`** para avaliar tamanho
13. **Registre decisões uma vez** em CHANGELOG_AGENT.md e referencie depois
14. **Mantenha SESSION_STATE.md curto** — máx. 60 linhas, objetivo, sem histórico

---

## Regras de uso de MCPs

### MCPs configurados (settings.json do projeto)
- **Playwright MCP**: `npx @playwright/mcp@latest --headed` — navegação autônoma
- **Vercel MCP**: `mcp__a0c23722-*` — deploy, logs, projetos
- **Supabase MCP**: `mcp__a7729ab9-*` — SQL, migrations, edge functions

### Regras de uso
- **Markitdown MCP é o padrão para leitura de qualquer arquivo** — sempre usar ferramentas `mcp__markitdown__*` ao invés da ferramenta `Read` para qualquer arquivo enviado na conversa; converte PDF, Word, Excel, imagens e texto para Markdown sob demanda, reduzindo tokens injetados no contexto
- **Playwright é o padrão para navegação** — nunca usar extensão Claude in Chrome como alternativa
- Se ferramentas `mcp__playwright__*` não aparecerem: reiniciar sessão antes de investigar código
- Playwright snapshots (`browser_snapshot`) nunca commitar — `.playwright-mcp/` está no `.gitignore`
- Vercel: sempre usar conta **Minha Automação** — nunca conta Essencial Auto Peças
- Deploy: `npx vercel --prod`

---

## Regras de Git/GitHub

- Commitar antes de qualquer refatoração grande
- Mensagens de commit em português, descritivas, no imperativo
- Commitar ao fim da sessão antes de usar `/clear`
- **Nunca commitar** `.env`, credenciais reais, `.claude/settings.local.json`
- **Nunca fazer push** sem autorização explícita do usuário
- Hook `UserPromptSubmit`: sync automático 1x/dia (silencioso nas demais mensagens)
- Hook `Stop`: auto-commit ao encerrar sessão

### Repositórios locais do projeto
| Repositório | Caminho local | Branch | Remote |
|---|---|---|---|
| Fábrica de SaaS | `C:\Users\NOTEBOOK\Documents\GitHub\AI-SaaS-Factory-Fabrica-de-Saas` | main | github.com/minhaautomacao/AI-SaaS-Factory-Fabrica-de-Saas |
| Enemeop Flores | `C:\Users\NOTEBOOK\Documents\GitHub\enemeop-flores` | master | github.com/minhaautomacao/enemeop-flores |

---

## Regras de credenciais

- **Nunca registrar valores reais** em arquivos versionados
- Toda nova credencial vai em `.credentials/<categoria>/.env`
- Após inserir credencial: atualizar `docs/CREDENTIALS_INDEX.md` imediatamente
- Verificar `.gitignore` antes de qualquer `git add`
- Padrões sempre no `.gitignore`: `.credentials/**/*.env`, `.env*`, `*.key`, `*.pem`, `*.p12`
- Backup seguro: cofre de senhas (Bitwarden, 1Password) — não em chat, não em email
- Rotação recomendada: 90 dias para chaves de API

---

## Stack técnica

### Frontend
- **Framework**: React 18 + Vite (ou Next.js para novos projetos)
- **Estilo**: Tailwind CSS
- **Estado**: Zustand global, useState local
- **Formulários**: React Hook Form + Zod

### Backend
- **BaaS**: Supabase (auth, banco, storage, edge functions)
- **Deploy**: Vercel (frontend) ou Render (APIs Node.js)
- **Cache/Queue**: Upstash Redis
- **DNS/CDN**: Cloudflare

### Integrações frequentes
- **Pagamentos**: Stripe ou Mercado Pago
- **WhatsApp**: Z-API (~R$79/mês) — Evolution/Baileys descartados
- **Email**: Resend (gratuito até 3.000/mês)
- **Monitoramento**: UptimeRobot

---

## Comandos úteis

```bash
npm run dev          # Desenvolvimento local
npm run build        # Build de produção
npm run typecheck    # Verificar tipos TypeScript
supabase db diff     # Ver mudanças pendentes
supabase db push     # Aplicar migrations
git push origin main # Deploy automático via Vercel
```

---

## Regras de desenvolvimento

### Prioridades — NUNCA inverter esta ordem
1. Manter o SaaS funcionando
2. Manter estabilidade
3. Manter custo zero durante desenvolvimento
4. Evitar regressões
5. Somente depois: desenvolver novas funcionalidades

### REGRA MAIS IMPORTANTE
**Nunca desenvolver novas funcionalidades enquanto existir problema crítico de infraestrutura.**

Problemas críticos que bloqueiam desenvolvimento:
- Render suspenso
- Supabase indisponível
- Deploy pendente importante
- Integrações quebradas (WhatsApp, Meta, WooCommerce)
- Banco indisponível

### Antes de alterar qualquer arquivo
Mostrar obrigatoriamente: impacto esperado / arquivos que serão alterados / riscos.
Depois: build → testes → validação → commit.
Nunca fazer alterações grandes em um único commit.

### Fluxo de deploy (obrigatório)
1. Auditoria → 2. Aprovação → 3. Deploy → 4. Testes → 5. Validação
**Nenhum deploy ocorre automaticamente.**

### Validação em produção
Toda funcionalidade só é concluída após validação no ambiente real:
painel / login / dashboard / WhatsApp / Instagram / WooCommerce / pagamento / logística

### Render — objetivos permanentes
- Nunca ultrapassar 5 GB mensais de bandwidth
- Sempre `WORKERS_ENABLED=false` durante desenvolvimento
- Monitorar: Bandwidth / Instance Hours / Workers / Health / Logs / Redis / BullMQ

### Redis / BullMQ — sempre reduzir
polling desnecessário / conexões abertas / workers inativos / filas desnecessárias

### Relatório final de toda tarefa
```
✔ O que foi alterado     ✔ Build
✔ Por que foi alterado   ✔ Testes
✔ Arquivos modificados   ✔ Deploy
✔ Resultado              ✔ Impacto esperado
✔ Riscos                 ✔ Próxima recomendação
```

### Tomada de decisão — sempre nesta ordem
1. Manter produção → 2. Reduzir riscos → 3. Reduzir custos → 4. Performance → 5. Novas features

---

## ROADMAP OPERACIONAL — Classificação obrigatória de pendências

Após o STATUS GERAL, sempre apresentar o ROADMAP em 3 fases antes de sugerir qualquer tarefa.

### FASE 1 — OPERAÇÃO
Tudo que impede o SaaS de operar.
Exemplos: Render / Deploy / Supabase / WhatsApp / Meta / WooCommerce / Pagamentos / Logística / DNS / SSL / Segurança

### FASE 2 — CONSOLIDAÇÃO
Tudo que melhora a operação existente.
Exemplos: Dashboard / Pedidos / Financeiro / Produção / Monitor Social / Configurações / Logs / Relatórios / Monitoramento

### FASE 3 — AUTOMAÇÃO
Tudo relacionado à IA e automações.
Exemplos: SDR / Agentes / Marketing / Pós-venda / CRM Inteligente

### Formato obrigatório após STATUS GERAL
```
ROADMAP OPERACIONAL

FASE 1 — OPERAÇÃO
[ ] item 1
[ ] item 2

FASE 2 — CONSOLIDAÇÃO
[ ] item 1

FASE 3 — AUTOMAÇÃO
[ ] item 1
```

### Regra de seleção da próxima tarefa
- Destacar **UMA única tarefa** — a que mais aproxima o SaaS da operação completa
- Explicar por que essa tarefa foi escolhida
- Estimar: impacto / risco / tempo / dependências
- **Nunca sugerir Fase 2 ou 3 se existir pendência crítica na Fase 1**
- O objetivo é conduzir o desenvolvimento como um produto SaaS em produção

### Comportamento proativo
Ao encontrar problema: explicar → propor solução → estimar impacto → estimar risco → aguardar aprovação.
Nunca: alterações destrutivas sem autorização / deletar serviços / suspender serviços / alterar integrações críticas sem confirmar dependências.

---

## Foco do Sprint Atual

> Ver docs/SESSION_STATE.md para estado detalhado atualizado.

### Fase 8 — Em andamento
- [ ] Agente WhatsApp SDR — resposta automática via Z-API
- [ ] CNAME Cloudflare para `app.enemeopflores.com.br`
- [ ] Renovação token Instagram — prazo: 2026-08-01
- [ ] Bug REQUER_ESCALADA — `orchestrator/src/workers/orquestrador.ts` linhas 38–43
