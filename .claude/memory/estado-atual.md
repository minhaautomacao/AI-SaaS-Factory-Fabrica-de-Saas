---
name: estado-atual
description: Estado completo do projeto em 2026-05-27 — o que foi criado, o que falta, próximos passos e como retomar
metadata:
  type: project
---

## Contexto geral

Projeto: **Fábrica de SaaS** — infraestrutura automatizada para criar, configurar e lançar SaaS completos com IA, voltada para empreendedores brasileiros com baixo custo inicial.

Repositório: `minhaautomacao/AI-SaaS-Factory-Fabrica-de-Saas` (branch `main`)  
Data deste snapshot: 2026-05-27  
Commits até agora: 11

---

## O que já foi criado

### Camada de configuração do Claude Code (`.claude/`)

| Arquivo | Status | O que contém |
|---|---|---|
| `CLAUDE.md` | Completo | Regras de dev, stack, variáveis de ambiente, fluxo de trabalho |
| `.claude/memory/stack.md` | Completo | Stack padrão com justificativa (tudo gratuito) |
| `.claude/memory/infraestrutura.md` | Completo | Limites críticos dos planos free + workarounds |
| `.claude/agents/orquestrador.md` | Completo | Orquestrador central: 2 escopos, 12 agentes mapeados, BullMQ, fallbacks, retry, exemplos reais |
| `.claude/agents/captacao-leads.md` | Completo | Captação multicanal (WhatsApp/Instagram/Facebook/Site), CRM, classificação de intenção, exemplos por canal |
| `.claude/agents/whatsapp-sdr.md` | Completo | Fluxo de venda em 18 etapas, upsell, follow-up, PIX, rastreio, exemplos por perfil de cliente |
| `.claude/skills/README.md` | Placeholder | índice dos skills |
| `.claude/skills/configurar-agentes.md` | Criado | skill de configuração de agentes |
| `.claude/skills/configurar-auth.md` | Criado | skill de auth Supabase |
| `.claude/skills/configurar-infraestrutura.md` | Criado | skill de infra gratuita |
| `.claude/skills/configurar-whatsapp.md` | Criado | skill de WhatsApp/Evolution API |
| `.claude/skills/pipeline-novo-saas.md` | Criado | skill do pipeline completo de novo SaaS |
| `.claude/skills/setup-pagamentos.md` | Criado | skill de integração de pagamentos |
| `.claude/commands/README.md` | Atualizado | Descreve os 4 comandos disponíveis |
| `.claude/commands/novo-saas.md` | Criado | Slash command `/novo-saas` |
| `.claude/commands/setup-auth.md` | Criado | Slash command `/setup-auth` |
| `.claude/commands/criar-pagina.md` | Criado | Slash command `/criar-pagina` |
| `.claude/commands/checklist-deploy.md` | Criado | Slash command `/checklist-deploy` |
| `.claude/agents/README.md` | Placeholder | Lista de agentes planejados |

### Guias de infraestrutura (`infraestrutura/`)

Todos os 6 guias estão completos com configuração passo a passo, limites e quando migrar para plano pago:
- `vercel.md`, `supabase.md`, `render.md`, `upstash.md`, `uptimerobot.md`, `cloudflare.md`

### Templates de SaaS (`templates/`)

| Template | Status | O que inclui |
|---|---|---|
| `saas-base/` | Completo | Auth + dashboard + pricing + Stripe + Supabase RLS. Estrutura de pastas + schema SQL + .env.example |
| `saas-b2b/` | Completo | Multi-tenant + workspaces + convites + papéis + billing por org. Schema multi-tenant + sistema de permissões TypeScript |
| `agente-base/` | Completo | Chat com Claude API + streaming + memória + tool use. Hook useChat + endpoint SSE + schema conversas/mensagens |

### Aplicação web (`src/`)

Interface React funcional com:
- **Autenticação** por senha (localStorage)
- **SaaSPlannerForm**: formulário para descrever ideia → chama `/api/generate-saas` → usa **Google Gemini** para gerar plano de SaaS
- **SaaSDetailsViewer**: exibe módulos, stack, prompts estruturais, GitHub Actions do SaaS gerado
- **TerminalSimulator**: simula pipeline de build em 5 etapas com logs em tempo real
- **SystemOverviewDiagram**: diagrama visual das 5 etapas do processo
- **CloudArchitectureReport**: aba de relatório de arquitetura em nuvem
- **Sidebar**: lista de projetos criados
- **server.ts**: Express + endpoints `/api/generate-saas`, `/api/templates`, `/api/config-status`

Stack da aplicação: React 19 + Vite + Tailwind CSS v4 + TypeScript + Express + tsx

### Templates de credenciais (`.credentials/`)

Estrutura de pastas com READMEs criados (sem valores reais): financeiro, marketing, whatsapp, logistica, comunicacao, infraestrutura.

### GitHub Actions (`.github/workflows/`)

- `claude.yml` — Claude PR Assistant (revisa PRs automaticamente)
- `claude-code-review.yml` — Claude Code Review (analisa código em PRs)

---

## O que está em andamento

**Fase 6 concluída.** Migrations Supabase criadas, serviço `orchestrator/` implementado com BullMQ + Upstash Redis, documento de teste do fluxo completo criado. Próximo passo: instalar dependências e executar o teste real.

---

## Decisões estratégicas tomadas

### 1. Dois escopos separados no orquestrador
- **Escopo Fábrica**: criar novos SaaS do zero
- **Escopo Produção**: operar SaaS já no ar (pedidos, clientes, cobranças)
- Separação por filas BullMQ distintas

### 2. Floricultura como negócio-referência
Todos os exemplos de agentes usam uma floricultura fictícia. Isso mantém consistência entre os documentos e facilita entender o fluxo completo sem precisar de contexto extra.

### 3. BullMQ + Upstash Redis como backbone de mensagens
Comunicação entre agentes via filas com prioridade, não via chamadas diretas. Permite retry, timeout por urgência e execução paralela controlada.

### 4. Escalonamento para Carlos em situações específicas
- Divergência financeira acima de R$ 500
- SDR sem fechar em 10 minutos
- Reclamação grave
- Ação financeira irreversível
Carlos é o fallback humano final. Todos os agentes têm esse mecanismo.

### 5. Claude Sonnet 4.6 como modelo padrão de todos os agentes
Definido no orquestrador e replicado nos agentes criados.

### 6. Aplicação web usa Google Gemini (não Claude) para geração de SaaS
A interface `src/` chama a API do Gemini via `GEMINI_API_KEY`. Isso é intencional — a fábrica em si usa Claude Code como interface de trabalho, enquanto a aplicação web demonstrativa foi construída com Gemini. Não mudar sem decisão explícita.

### 7. Infraestrutura gratuita primeiro, paga conforme escala
Documentado em `infraestrutura.md` com os limites exatos de cada serviço e quando migrar.

### 8. Sem desconto nos agentes de venda
Decisão de negócio: preços fixos. Todos os agentes de atendimento devem responder naturalmente que os preços já são os melhores da região.

---

## Agentes: status detalhado

### Criados (11 de 12)
| Agente | Arquivo | Status |
|---|---|---|
| Orquestrador | `orquestrador.md` | Completo |
| Captação de Leads | `captacao-leads.md` | Completo |
| WhatsApp SDR | `whatsapp-sdr.md` | Completo |
| Financeiro | `financeiro.md` | Completo |
| Logística | `logistica.md` | Completo — inclui spec da Tela de Despachos |
| Conciliação | `conciliacao.md` | Completo — Open Banking + maquininhas + caixa manual |
| Operacional | `operacional.md` | Completo — máquina de estados + confirmação manual |
| Rastreamento | `rastreamento.md` | Completo — polling 20min + extravio 2h + resolução automática |
| Pós-Venda | `pos-venda.md` | Completo — NPS + histórico + badges #XXXXX + retenção |
| Marketing | `marketing.md` | Completo — 10 canais + funis + datas + retargeting + UGC |
| Inteligência | `inteligencia.md` | Completo — 8 módulos + anomalias + competitiva + dashboard |

### Criados (12 de 12 — todos os agentes concluídos)
| Agente | Arquivo | Status |
|---|---|---|
| Agente Dev | `agente-dev.md` | Completo — escopo Fábrica, cria código React/Supabase, corrige bugs |

### Pulado por decisão
| Agente | Arquivo | Observação |
|---|---|---|
| Estoque | `estoque.md` | Baixa prioridade — criar conforme necessidade |

### Faltam criar (9 de 12)
| Agente | Prioridade sugerida | Função principal |
|---|---|---|
| `financeiro.md` | Alta | Boleto, PIX, nota fiscal, conciliação manual, relatórios |
| `logistica.md` | Alta | Frete, coleta, rastreamento, etiqueta, devoluções |
| `conciliacao.md` | Alta | Conciliar extrato, fechar caixa, identificar divergências |
| `operacional.md` | Média | Status de pedido, cancelamentos, sincronização de sistemas |
| `rastreamento.md` | Média | Status de entrega, alertas de atraso, ocorrências |
| `pos-venda.md` | Média | Pesquisa de satisfação, trocas, retenção |
| `marketing.md` | Média | Conteúdo, campanhas, copy, SEO, email marketing |
| `estoque.md` | Baixa | Quantidade, alertas de ruptura, ordens de compra |
| `inteligencia.md` | Baixa | Análise de dados, previsão, anomalias, insights |
| `agente-dev.md` | Fábrica | Criar componentes React, migrations Supabase, corrigir bugs |

---

## Próximos passos em ordem

### Fase 1 — Agentes operacionais críticos (fazer agora)
Esses três são acionados pelo fluxo do SDR e precisam existir para o sistema funcionar de ponta a ponta:

1. **`financeiro.md`** — o SDR aciona ele para gerar o PIX/link. Sem ele, o fluxo de venda para na etapa 11.
2. **`logistica.md`** — o SDR aciona ele para calcular o frete. Sem ele, o fluxo para na etapa 9.
3. **`conciliacao.md`** — monitora o pagamento em tempo real após o PIX ser gerado.

### Fase 2 — Agentes operacionais de suporte
4. **`operacional.md`** — libera produção após pagamento. Aciona logística de saída.
5. **`rastreamento.md`** — assume o monitoramento pós-entrega do SDR.
6. **`pos-venda.md`** — fecha o ciclo com pesquisa de satisfação.

### Fase 3 — Crescimento e análise
7. **`marketing.md`** — criação de conteúdo, campanhas, outreach.
8. **`estoque.md`** — gestão de inventário e alertas de ruptura.
9. **`inteligencia.md`** — análises, previsões e relatórios estratégicos.

### Fase 4 — Fábrica em si
10. **`agente-dev.md`** — agente que escreve código React/Supabase para novos projetos.

### Fase 5 — Skills e comandos slash
11. **`.claude/skills/criar-saas.md`** — guia passo a passo para iniciar novo SaaS
12. **`.claude/skills/configurar-auth.md`** — setup de autenticação Supabase
13. **`.claude/skills/setup-pagamentos.md`** — integrar Stripe ou Mercado Pago
14. **`.claude/skills/deploy-producao.md`** — checklist de deploy
15. **`.claude/commands/novo-saas.md`** — comando slash `/novo-saas`
16. **`.claude/commands/setup-auth.md`** — comando slash `/setup-auth`
17. **`.claude/commands/criar-pagina.md`** — comando slash `/criar-pagina`
18. **`.claude/commands/checklist-deploy.md`** — comando slash `/checklist-deploy`

### Fase 6 — Schema do banco e infraestrutura real
19. Migration Supabase para tabela `leads` e `orchestrator_logs`
20. Configuração BullMQ com Upstash Redis
21. Primeiro teste do fluxo completo: lead → SDR → financeiro → conciliação → operacional

---

## Como retomar o trabalho em sessão nova

### Leitura obrigatória ao começar
```
1. CLAUDE.md                          — regras e stack
2. .claude/memory/estado-atual.md     — este arquivo (estado do projeto)
3. .claude/memory/stack.md            — stack técnica
4. .claude/memory/infraestrutura.md   — limites dos planos free
5. git log --oneline                  — ver o que foi feito recentemente
```

### Para criar o próximo agente
1. Ler `orquestrador.md` — ver como o agente está descrito no mapa
2. Ler `captacao-leads.md` e `whatsapp-sdr.md` como referência de formato
3. Criar `.claude/agents/[nome].md` seguindo o padrão estabelecido
4. Incluir: identidade, responsabilidades, fluxo, integrações, estruturas TypeScript, exemplos reais com floricultura, tratamento de falhas, restrições
5. Commitar com mensagem em português

### Padrão de formato dos agentes
Todos os agentes seguem esta estrutura:
- **Identidade** (modelo, modo, tom, capacidade)
- **Responsabilidades** (quando acionar, o que faz)
- **Fluxo de trabalho** (diagrama ou lista numerada)
- **Regras de comportamento** (específicas da função)
- **Integrações** (tabela: qual agente, quando, o que recebe)
- **Estruturas TypeScript** (interfaces dos eventos de entrada/saída)
- **Exemplos reais** (conversas ou cenários da floricultura)
- **Tratamento de falhas** (tabela: situação → ação)
- **Restrições** (o que nunca fazer)

### Convenções estabelecidas
- Idioma: português brasileiro em tudo
- Negócio-referência para exemplos: floricultura
- Modelo padrão: `claude-sonnet-4-6`
- Mensagens de commit em português
- Não commitar `.claude/settings.local.json` (tem configurações locais)
- Nunca prometer prazo sem confirmar com agente de logística
- Nunca gerar cobrança sem confirmação explícita do cliente

**Why:** Este arquivo foi criado para que qualquer sessão nova possa retomar o trabalho exatamente de onde parou, sem precisar reler todos os arquivos do projeto nem reconstruir o contexto manualmente.  
**How to apply:** Sempre ler este arquivo no início de uma sessão antes de qualquer ação. Atualizar quando houver mudanças significativas no projeto.
