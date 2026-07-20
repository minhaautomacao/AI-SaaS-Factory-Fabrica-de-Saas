# Arquitetura da Fábrica de SaaS

> Este documento define o que a Fábrica de SaaS é, o que ela não é, e como
> qualquer sistema de cliente (incluindo a Enemeop Flores) deve se relacionar
> com ela. Ver também `docs/CLIENT_ISOLATION_POLICY.md` e
> `docs/NEW_SAAS_GUIDE.md`.

## 1. Finalidade

A Fábrica de SaaS é uma **plataforma genérica** para criar, configurar e
lançar SaaS de automação comercial (agentes de IA, canais de atendimento,
orquestração de pedidos) para diferentes clientes. Ela não é um produto para
usuário final — é a ferramenta que constrói produtos para usuário final.

## 2. Responsabilidades

- Manter componentes, agentes, templates e conectores reutilizáveis por
  qualquer cliente futuro.
- Fornecer scaffolding para criar um novo SaaS a partir de configuração,
  não de código duplicado.
- Manter infraestrutura comum (schema multi-tenant, filas, retry,
  observabilidade) que qualquer cliente pode herdar.
- Documentar como um novo sistema deve ser criado (`NEW_SAAS_GUIDE.md`).

## 3. Limites (o que a Fábrica NÃO é)

- Não é o lugar onde um cliente específico opera. Operação real —
  credenciais, webhooks configurados, catálogo de produtos, regras
  comerciais, histórico de atendimento — pertence ao repositório do cliente.
- Não depende de nenhum cliente para funcionar. Hoje, na prática, isso está
  violado: código e dados operacionais da Enemeop Flores estão neste
  repositório. Ver `docs/ENEMEOP_EXTRACTION_MAP.md` para o plano de correção.
- Não deve conter nenhum dado que identifique um cliente. Ver a regra abaixo.

> **Nenhum dado operacional, credencial, segredo, identidade, configuração
> de produção, histórico, documentação específica ou informação
> identificável de clientes pode ser armazenado no repositório da Fábrica
> de SaaS.**

## 4. Núcleo genérico

Componentes que devem permanecer na Fábrica porque não dependem de nenhum
cliente específico (ver revisão arquitetural em `ENEMEOP_EXTRACTION_MAP.md`
para o veredito arquivo a arquivo):

- **Tipos** — `orchestrator/src/types.ts`
- **Fila** — `orchestrator/src/lib/queue.ts` (BullMQ)
- **Redis** — `orchestrator/src/lib/redis.ts`
- **Executor de jobs / registro de agentes** — `supabase/functions/orquestrador/index.ts`,
  tabela `ROTEAMENTO` tipo-evento → agente
- **Retry / dead-letter** — lógica de fila em `orchestrator/src/lib/queue.ts`
- **Logging** — `supabase/functions/_shared/logger.ts`
- **Métricas** — tabela `orchestrator_logs` (migration `20260527000002`)
- **Abstração de Supabase** — `orchestrator/src/lib/supabase.ts`,
  `supabase/functions/_shared/supabase.ts`
- **Abstração de canais** — contrato genérico de envio de mensagem
  (`_shared/whatsapp.ts` é genérico; `_shared/instagram.ts` e
  `_shared/lalamove.ts` **não são** — têm IDs/endereço da Enemeop
  hardcoded, precisam de generalização antes de virarem núcleo puro)
- **Abstração de catálogo** — ainda não existe como interface; hoje é
  acoplada (`orchestrator/src/catalog/liveSiteCatalog.ts` é 100% Enemeop)
- **Abstração de pagamentos** — parcialmente existe (`_shared/cielo.ts` é
  um adaptador razoavelmente genérico da API Cielo)
- **Abstração de logística** — `_shared/transportadoras.ts`,
  `_shared/melhor-envio.ts`, `orchestrator/src/lib/melhor-envio.ts`,
  `orchestrator/src/lib/lalamove.ts` (o de `orchestrator/src/lib/`, não o
  de `_shared/`) são adaptadores HTTP genéricos
- **Configuração por workspace** — tabelas `workspaces` e
  `workspace_credentials` (migrations `20260527000003` e `20260527000004`)

**Importante:** o núcleo do orquestrador **não será simplesmente removido**
da Fábrica. A maior parte de `orchestrator/` é genérica; apenas os arquivos
com lógica/dados da Enemeop hardcoded migram. Ver detalhamento arquivo a
arquivo em `docs/ENEMEOP_EXTRACTION_MAP.md`.

## 5. Contratos de agentes

Os 13 arquivos em `.claude/agents/*.md` definem o contrato de cada agente
genérico (financeiro, logística, estoque, marketing, SDR, etc.) que um
workspace pode ativar. Contrato = responsabilidade do agente + formato de
entrada/saída + regras de escalonamento. Parâmetros específicos de negócio
(limiares de aprovação, regras de desconto, thresholds de badge de cliente)
**não** deveriam estar fixos no contrato — devem ser configuráveis por
workspace. Hoje isso está parcialmente violado (ver seção 8 de
`ENEMEOP_EXTRACTION_MAP.md` e `docs/CLIENT_ISOLATION_POLICY.md`).

## 6. Interfaces de canais

Um canal (WhatsApp, Instagram, Facebook Messenger, e-mail) deve ser
implementado como um adaptador que recebe: token/credencial via env var ou
`workspace_credentials`, e devolve uma interface comum de
enviar/receber mensagem. Hoje o adaptador de Instagram (`_shared/instagram.ts`)
tem o `IG_PAGE_ID` da Enemeop hardcoded como valor de exemplo — deveria vir
sempre de configuração do workspace.

## 7. Interfaces de catálogo

Ainda não existe uma interface genérica de catálogo. O que existe
(`orchestrator/src/catalog/liveSiteCatalog.ts`) é um scraper acoplado ao
WooCommerce da Enemeop. Uma interface de catálogo genérica precisaria de:
método de busca por categoria/ocasião, método de busca por código, e um
adaptador plugável (scraping, API própria, planilha, etc.) por workspace.

## 8. Interfaces de pagamento

`_shared/cielo.ts` é o adaptador mais próximo de genérico hoje. Uma
interface de pagamento completa precisaria abstrair também Mercado Pago e
Stripe (já citados como padrão da Fábrica no `CLAUDE.md`), com o provedor
escolhido por workspace via `workspace_credentials.tipo`.

## 9. Infraestrutura reutilizável

- Schema multi-tenant: `workspaces`, `workspace_credentials`, `leads`,
  `orchestrator_logs`, cron jobs (migrations `20260527000001` a
  `20260529000007`) — genérico, mas **hoje sem coluna `workspace_id` em
  `leads`** (ver achado na revisão arquitetural) — não é multi-tenant
  funcional ainda, é multi-tenant de nome.
- GPT Advisor (`ai/advisor.ts`, `scripts/gpt-advisor.ts`) — ferramenta
  genérica de auditoria assistida, hoje pausada (ver `docs/GPT_ADVISOR_RULES.md`).

## 10. Configuração por workspace

O modelo pretendido: cada cliente é uma linha em `workspaces`, com
credenciais em `workspace_credentials` (criptografadas, chave/valor por
tipo de integração) e configuração de negócio (segmento, prompts, limiares)
também parametrizada por workspace — não hardcoded em agente ou função.
Esse modelo existe na tabela, mas não é seguido de forma consistente pelo
código hoje (ver `ENEMEOP_EXTRACTION_MAP.md`, achados de acoplamento).

## 11. Estratégia futura de pacotes versionados

Para evitar que um novo cliente dependa de caminho local do tipo
`..\AI-SaaS-Factory-Fabrica-de-Saas\...`, a estratégia recomendada, em
ordem de introdução (não implementar tudo de uma vez):

1. **Curto prazo (usado nesta separação):** copiar os componentes genéricos
   necessários para o repositório do cliente no momento da criação do SaaS.
   Simples, sem infraestrutura extra, mas gera duplicação de código entre
   clientes.
2. **Médio prazo:** publicar os módulos genéricos estáveis (tipos, fila,
   adaptadores de provedor) como pacote(s) npm privados via GitHub Packages,
   versionados semanticamente. Cada projeto de cliente declara a versão que
   usa.
3. **Evitar:** git submodule (complexidade operacional alta para o ganho) a
   menos que surja uma razão técnica forte.

## 12. Como novos sistemas devem ser criados

Ver `docs/NEW_SAAS_GUIDE.md` para o fluxo completo. Resumo: um novo SaaS
nunca deve ser criado copiando o repositório da Enemeop — deve nascer do
scaffolding genérico da Fábrica (`scripts/criar-saas.ts` + `templates/`) e
receber a identidade do cliente só via configuração.
