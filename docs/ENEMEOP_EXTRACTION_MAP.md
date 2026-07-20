# Mapa de Extração — Enemeop Flores → repositório próprio

> Documento temporário de migração. Existe enquanto a separação entre a
> Fábrica de SaaS e a aplicação Enemeop Flores estiver em andamento. Deve
> ser removido (ou arquivado) quando a migração de código for concluída.
>
> Este documento **não migra código**. Registra o plano. A movimentação
> de código acontece em uma etapa futura, ainda não iniciada.
>
> Convenção de colunas: **Destino** = `Fábrica` (permanece) / `Enemeop`
> (migra) / `Dividir` (parte fica, parte migra) / `Obsoleto` / `Validar`
> (depende de confirmação antes de decidir).

## 1. `orchestrator/`

| Caminho | Destino | Parte genérica | Parte específica | Dependências | Risco | Teste necessário | Ordem |
|---|---|---|---|---|---|---|---|
| `orchestrator/src/types.ts` | Fábrica | Todo o arquivo | — | Nenhuma | Baixo | Typecheck após qualquer mudança de import | — |
| `orchestrator/src/lib/queue.ts` | Fábrica | Todo o arquivo (BullMQ) | — | Redis | Baixo | Teste de fila local | — |
| `orchestrator/src/lib/redis.ts` | Fábrica | Todo o arquivo | — | `UPSTASH_REDIS_*` | Baixo | Conexão local | — |
| `orchestrator/src/lib/supabase.ts` | Fábrica | Todo o arquivo | — | env vars Supabase | Baixo | — | — |
| `orchestrator/src/lib/melhor-envio.ts` | Fábrica | Todo o arquivo (cliente HTTP) | — | `MELHOR_ENVIO_*` | Baixo | — | — |
| `orchestrator/src/lib/lalamove.ts` | Fábrica | Todo o arquivo (cliente HTTP, sem coordenada fixa) | — | `LALAMOVE_*` | Baixo | — | — |
| `orchestrator/src/lib/whatsapp.ts` | Fábrica | Quase todo — ressalva: `escopo: 'producao'` hardcoded em `notificarEscalada` (linha ~127) | Acoplamento leve, não bloqueia | `ZAPI_*` | Baixo | Confirmar se múltiplos workspaces em produção algum dia quebram esse valor fixo | 3 |
| `orchestrator/src/lib/instagram.ts` | Enemeop | Estrutura de chamada HTTP à Graph API | `PAGE_ID`/`FB_PAGE_ID` com default hardcoded da Enemeop | `_shared/instagram.ts` (padrão duplicado) | Médio | Confirmar que remover o default não quebra chamada sem env var setada | 2 |
| `orchestrator/src/lib/sdr.ts` | Enemeop | — | 100% — persona "Flora" completa (endereço, telefone, PIX, regras de catálogo) | Prompt usado em produção | Alto (é o cérebro da IA) | Testar resposta da IA após mover, comparar com comportamento atual | 1 |
| `orchestrator/src/catalog/liveSiteCatalog.ts` | Enemeop | — | 100% — scraper acoplado a `www.enemeopflores.com.br` | WooCommerce da loja | Médio | Rodar scraping após mover, comparar contagem de produtos | 2 |
| `orchestrator/src/catalog/test-live.ts` | Enemeop | — | Teste manual contra o site real | idem acima | Baixo | — | 2 |
| `orchestrator/src/index.ts` | Dividir | Bootstrap do servidor/rotas | Default de `META_VERIFY_TOKEN = 'enemeop_flores_2026'` | Nenhuma | Baixo | Trocar default por string vazia antes de mover cópia genérica | 1 |
| `orchestrator/src/workers/orquestrador.ts` | Fábrica (roteamento) / Validar (regras `REQUER_ESCALADA`) | Estrutura de roteamento tipo→agente | Os 3 tipos de `REQUER_ESCALADA` podem ser específicos do modelo de negócio da Enemeop (nenhum produtor real encontrado no código, ver `docs/RLS_SECURITY_PLAN.md`/relatório anterior) | — | Baixo | Confirmar se algum agente futuro genérico precisa desse conceito | 3 |
| `orchestrator/src/workers/logistica.ts` | Enemeop | Estrutura de chamada ao worker | `LALAMOVE_ORIGEM` com lat/lng/endereço fixos da Enemeop (linha ~139-140) | `_shared/lalamove.ts` (mesmo padrão duplicado) | Médio | Confirmar consistência com `_shared/lalamove.ts` após mover | 2 |
| `orchestrator/render.yaml` | Enemeop | Estrutura do serviço Render | Serviço `enemeop-evolution` nomeado, **connection string real hardcoded (S1, ver `SECURITY_INCIDENTS.md`)** | Render | Alto — não mover sem antes sanitizar/rotacionar | Confirmar rotação da credencial antes de mover | 4 (depende de rotação) |
| `render.yaml` (raiz do repositório, achado na Etapa C) | Enemeop | Estrutura do serviço Render | Serviço `enemeop-whatsapp-bridge`, `rootDir: whatsapp-bridge` — **esse diretório não existe em nenhum lugar do Git**; arquivo também tem um token Upstash Redis real hardcoded (S1, não catalogado antes da Etapa C — ver `enemeop-flores/docs/MISSING_SOURCE_FUNCTIONS.md` e `SECURITY_INCIDENTS.md` da Enemeop) | Render | Alto — mesmo motivo do item acima, mais a incerteza de o código nunca ter sido versionado | Confirmar no painel Render se este serviço está deployado antes de qualquer decisão | 4 (depende de rotação e de recuperar o código-fonte, se existir) |
| `orchestrator/.env.example` | Dividir | Estrutura de chaves | `META_VERIFY_TOKEN`/`INSTAGRAM_PAGE_ID` preenchidos com valor real em vez de placeholder | Nenhuma | Baixo | Trocar por placeholder antes de decidir se fica ou migra | 1 |
| `orchestrator/scripts/test-whatsapp.ts` | Enemeop | Estrutura de teste | Testa contra número real da Enemeop | Z-API | Baixo | — | 3 |

## 2. `supabase/functions/`

| Caminho | Destino | Observação | Risco | Ordem |
|---|---|---|---|---|
| `orquestrador/`, `conciliacao/`, `estoque/`, `financeiro/`, `operacional/`, `pos-venda/`, `rastreamento/`, `inteligencia/`, `agente-dev/`, `marketing/` (exceto achado abaixo) | Fábrica | Prompts genéricos "agente X da Fábrica", sem nome/ID de cliente | Baixo | — |
| `marketing/index.ts` (linhas ~656-665) | Dividir | Contém chamada de produção real documentada (`workspace_id: "enemeop"`, endpoint real da Fábrica) — não é exemplo. Extrair antes de considerar genérico | Médio | 1 |
| `webhook-meta/index.ts` | Enemeop | Catálogo de produtos/preços hardcoded no prompt, telefone/endereço reais, `WHATSAPP_NUM` fixo. **Preservar o fix `graph.instagram.com` vs `graph.facebook.com` (linhas 444-456) — comportamento validado em produção (missão M002)** | Alto | 1 |
| `webhook-whatsapp/index.ts` | Enemeop | Catálogo, regras de venda, credenciais Z-API hardcoded como fallback (**S1, ver `SECURITY_INCIDENTS.md`** — sanitizar antes de mover) | Alto | 1 (depende de rotação Z-API) |
| `webhook-whatsapp-proxy/index.ts` | Enemeop | Ponte de transição para sistema antigo da floricultura | Baixo | 2 |
| `whatsapp-sdr/index.ts` | Enemeop | Prompt fixo "SDR da floricultura Enemeop Flores" | Médio | 1 |
| `leads-enemeop/index.ts` | Enemeop | Nome já denuncia; hoje deployado no projeto Supabase **da Fábrica**. **Confirmado ativo na Etapa C**: `dashboard/leads/page.tsx` e `monitor-social/page.tsx` do frontend Enemeop chamam esta função diretamente, sem autenticação (`verify_jwt: false`) — não é resíduo, é dependência real de produção hoje | Alto (revisado de Médio — é dependência ativa confirmada) | 1 (revisado — mover com cautela, testar as duas páginas do frontend) |
| `agente-financeiro/index.ts` | Enemeop | Prompt cita Enemeop, `softDescriptor` fixo | Médio | 2 |
| `agente-logistica/index.ts` | Enemeop | CEP de coleta fixo, User-Agent com e-mail pessoal do operador | Médio | 2 |
| `webhook-cielo/index.ts` | Fábrica (genérico) — ressalva | Comentário com URL literal do projeto Supabase da Fábrica — baixa sensibilidade, fácil de generalizar | Baixo | 3 |
| `logistica/index.ts` | Dividir | Consulta multi-transportadora genérica + `SYSTEM_PROMPT` cita Enemeop e (bug) "Aracaju" | Médio | 1 |
| `captacao-leads/index.ts` | Dividir | Fluxo de classificação genérico + `SYSTEM_PROMPT` cita a floricultura e cidade padrão "Aracaju" (bug) | Médio | 1 |

## 3. `supabase/functions/_shared/`

| Caminho | Destino | Observação | Risco |
|---|---|---|---|
| `anthropic.ts`, `credentials.ts`, `email.ts`, `logger.ts`, `melhor-envio.ts`, `supabase.ts`, `transportadoras.ts`, `types.ts`, `whatsapp.ts` | Fábrica | Adaptadores genéricos, sem tenant fixo | Baixo |
| `meta.ts` | Obsoleto | Código morto — nada importa; usa endpoint desatualizado que conflita com o fix de produção se reativado. Seguro remover (confirmado sem referências) | Baixo |
| `instagram.ts` | Enemeop | `IG_PAGE_ID` hardcoded (`350648311678163`) | Médio |
| `lalamove.ts` | Enemeop | Coordenadas/endereço fixos da Enemeop como constantes de módulo (`ORIGEM_LAT/LNG/ENDERECO`), usados como fallback | Médio |

## 4. `.claude/agents/`

| Caminho | Destino | Observação | Risco |
|---|---|---|---|
| `agente-dev.md`, `captacao-leads.md`, `conciliacao.md`, `inteligencia.md`, `operacional.md`, `orquestrador.md`, `rastreamento.md` | Fábrica | Genéricos, exemplos claramente rotulados | Baixo |
| `estoque.md`, `pos-venda.md`, `whatsapp-sdr.md` | Fábrica, com ressalva | Contêm thresholds fixos (R$500, critérios de badge, política "nunca dar desconto") apresentados como regra do sistema, não como exemplo — precisam virar parâmetro de workspace antes de reuso por outro cliente. Ver seção 8 | Médio |
| `financeiro.md` | Fábrica, com ressalva | Mesmo limiar de R$500 repetido | Médio |
| `logistica.md` | Fábrica | Catálogo de provedores é opção, não integração fixa | Baixo |
| `marketing.md` | Fábrica, com ressalva forte | Contém chamada de produção real (`workspace_id: "enemeop"`) fora de seção de exemplo | Alto — extrair antes de tratar como template |

## 5. `.claude/memory/`

| Caminho | Destino | Observação | Risco |
|---|---|---|---|
| `MEMORY.md` | Dividir | Índice — remover entradas específicas da Enemeop (`enemeop-flores.md`, `credenciais-meta.md`), manter só índice genérico | Baixo |
| `estado-atual.md` | Dividir | Cabeçalho de protocolo (Fábrica) + bloco "SaaS Enemeop Flores" inteiro (URLs, refs Supabase, credenciais Meta) migra | Médio |
| `enemeop-flores.md` (local, não versionado) | Enemeop | Contém senha admin em texto puro — **sanitizar antes de mover, não copiar o valor** | Alto |
| `credenciais-meta.md` (local, não versionado) | Enemeop | Contém App Secret Meta em texto puro — **sanitizar antes de mover** | Alto |
| `infraestrutura-ids.md` (local, não versionado) | Dividir | IDs da Fábrica ficam; IDs da Enemeop migram | Baixo |

## 6. Documentação (`docs/`)

| Caminho | Destino |
|---|---|
| `GPT_ADVISOR_RULES.md` | Fábrica |
| `CURRENT_STATE.md`, `KNOWN_ISSUES.md`, `CHANGELOG_AGENT.md`, `DECISIONS.md`, `CREDENTIALS_INDEX.md`, `ROADMAP.md`, `SESSION_STATE.md`, `GITHUB_SYNC_STATE.md`, `whatsapp-zapi.md` | Enemeop (documentação operacional do cliente) |

## 7. Scripts (`scripts/`)

| Caminho | Destino | Observação |
|---|---|---|
| `criar-saas.ts`, `gpt-advisor.ts` | Fábrica | Genéricos |
| `setup-secrets.ps1` | Fábrica | Confirmado: só referencia o Supabase da própria Fábrica |
| `sincronizar-repos.ps1`, `auto-commit-ao-sair.ps1`, `setup-novo-ambiente.ps1`, `verificar-ambiente.ps1` | Dividir | Lógica genérica de sync/setup + nome "enemeop-flores" hardcoded como repo satélite — extrair para arquivo de config |
| `setup-vercel-env.ps1` | Fábrica, corrigir | Aponta para scope Vercel errado (`essencial-auto-pecas-projects`) — bug pré-existente, não é migração, é correção separada |

## 8. Migrations (`supabase/migrations/`)

| Caminho | Destino | Observação |
|---|---|---|
| `20260527000001_leads.sql` até `20260602000008_leads_fix.sql` | Fábrica | Schema genérico (leads, workspaces, workspace_credentials, orchestrator_logs, cron) — ressalva: `leads` sem `workspace_id`, não é multi-tenant funcional hoje |
| `20260625000009_catalogo_produtos.sql` | Enemeop | Schema pensado para catálogo fixo de flores |

## 9. Componentes de floricultura (`src/components/floricultura/`, `server.ts`)

| Caminho | Destino | Observação |
|---|---|---|
| `PedidosView.tsx`, `ProducaoScreen.tsx` | Enemeop | Título/branding "Enemeop Flores" hardcoded |
| `server.ts` rota `/api/floricultura/pedidos` | Enemeop | Usa `SUPABASE_ENEMEOP_*` |
| `src/components/layout/FactorySidebar.tsx` | Dividir | Shell genérico + seção "Floricultura" hardcoded — mover para registro dinâmico `MODULOS_POR_SEGMENTO` |
| `ai/prompt.ts` | Dividir | Linha fixa `'Enemeop Flores'` como "Projeto" — trocar por parâmetro |

## 10. Screenshots e artefatos de sessão

| Caminho | Destino | Observação |
|---|---|---|
| 46 PNGs na raiz + `snapshot-acoes.md` | Obsoleto (remover do versionamento, não migrar) | Evidência de sessão real, entraram via `git add -A` do hook, não intencionalmente. **4 deles (`generate-token.png`, `meta-explorer.png`, `meta-explorer-2.png`, `graph-explorer.png`) contêm fragmento visível de token de acesso Meta real** — ver `SECURITY_INCIDENTS.md` |

## 11. Arquivos de credenciais

| Caminho | Destino | Observação |
|---|---|---|
| `.credentials/ia/.env` | Fábrica | `OPENAI_API_KEY`, usado pelo GPT Advisor |
| `.credentials/infraestrutura/.env` | Dividir | Chaves da Fábrica ficam; chaves `SUPABASE_ENEMEOP_*`, `RENDER_EVOLUTION_DB_URL`, `UPSTASH_*`, `CARLOS_WHATSAPP`, `VERCEL_PROJECT_ENEMEOP_ID`, `WOOCOMMERCE_*`, `WORDPRESS_*` migram |
| `.credentials/meta/.env` | Enemeop | Todas as `META_*` |
| `.credentials/whatsapp/.env` | Enemeop | Todas as `ZAPI_*` |
| `INSTRUCOES-PARA-IA-DO-NOTEBOOK.md`, `SETUP-NOTEBOOK.md` | Dividir | Passo genérico de setup de ambiente fica; qualquer valor real (senha, anon key) sai do texto — sanitizar antes de decidir onde cada parte fica |

## 12. Outros itens obsoletos (sem dado de cliente, mas fora de escopo)

| Caminho | Destino |
|---|---|
| `.claude/agents/README.md`, `.claude/skills/README.md`, `.claude/commands/README.md` | Obsoleto — desatualizados, corrigir ou remover |
| `metadata.json`, `skills-lock.json` | Obsoleto — resíduo de outra ferramenta (Google AI Studio / HyperFrames), sem relação com o projeto |

---

## Nota final

O núcleo do orquestrador (fila, Redis, tipos, executor, roteamento) **não
será removido da Fábrica**. Apenas os arquivos com dado/lógica da Enemeop
hardcoded (persona da Flora, catálogo, coordenadas, webhooks configurados,
credenciais) migram. A tabela acima é o inventário completo para essa
decisão — nenhuma migração de código foi executada ainda.
