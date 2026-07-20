# Backlog do Núcleo Genérico

> Refatorações maiores identificadas durante a separação Fábrica/Enemoop
> (2026-07-10) que não foram feitas na execução final por serem risco
> médio/alto ou exigirem desenho de abstração nova — registradas aqui
> para não se perderem. Nenhum destes itens bloqueia a conclusão da
> reorganização.

## 1. Registro dinâmico de módulos por segmento

`FactorySidebar.tsx` tinha uma seção "Floricultura" hardcoded (removida
nesta execução). O substituto correto é um registro
`MODULOS_POR_SEGMENTO: Record<string, {label, rota}[]>` carregado a
partir de `workspaces.segmento`, não implementado ainda.

## 2. Interface de catálogo genérica

Não existe hoje uma interface de catálogo abstrata. O scraper
`liveSiteCatalog.ts` (migrado para Enemeop) é 100% acoplado ao
WooCommerce da loja. Uma interface genérica precisaria de: busca por
categoria/ocasião, busca por código, adaptador plugável por workspace
(scraping, API própria, planilha).

## 3. Thresholds de aprovação/escalonamento como configuração de workspace

`.claude/agents/estoque.md`, `orquestrador.md`, `financeiro.md` repetem
o limiar de R$500 como regra fixa do sistema, não como parâmetro. Devem
virar campo configurável em `workspaces` (ex.:
`workspaces.human_approval_threshold`) antes de reuso por outro cliente.

## 4. Badges de cliente e política comercial em `.claude/agents/*.md`

`pos-venda.md` (critérios de badge Fiel/VIP/Inativo) e `whatsapp-sdr.md`
(política de desconto, catálogo de upsell) apresentam regras de negócio
específicas como se fossem padrão do sistema. Precisam de revisão para
extrair o que é realmente universal do que é calibrado para um cliente
específico, antes de reuso.

## 5. `scripts/sincronizar-repos.ps1`, `auto-commit-ao-sair.ps1`, `setup-novo-ambiente.ps1`, `verificar-ambiente.ps1`

Lógica genérica de sync/setup com o nome `enemeop-flores` hardcoded como
repositório satélite. Não foram alterados nesta execução porque ainda são
ferramentas de uso diário real para os dois repositórios atuais — mas
antes de um terceiro cliente existir, a lista de repositórios satélite
precisa sair do código-fonte e ir para um arquivo de configuração (ex.:
`.claude/repos-satelite.json`).

## 6. `scripts/setup-vercel-env.ps1` — scope Vercel errado

Bug pré-existente, não relacionado à separação: `$Scope =
"essencial-auto-pecas-projects"` deveria ser a conta "Minha Automação".
Registrado aqui só para não se perder — corrigir separadamente.

## 7. Prompts de identidade em Edge Functions que permaneceram genéricas

`_shared/cielo.ts` teve o `SoftDescriptor` parametrizado
(`WORKSPACE_NAME`) nesta execução. Vale revisar as demais Edge Functions
genéricas (`conciliacao`, `estoque`, `financeiro`, `operacional`,
`pos-venda`, `rastreamento`, `inteligencia`, `agente-dev`, `marketing`,
`orquestrador`, `webhook-cielo`) com a mesma lente — não foi feita uma
varredura linha a linha de todas nesta execução.

## 8. Testes desatualizados

`testes/fluxo-completo.md` e `testes/simulacao-sistema-completo.md`
referenciam scripts (`injetar-lead.ts`, `simular-captacao.ts`,
`simular-sdr.ts`, `inspecionar-fila.ts`) que não existem em
`orchestrator/scripts/`. Não corrigido nesta execução.

## 9. READMEs desatualizados

`.claude/agents/README.md`, `.claude/skills/README.md`,
`.claude/commands/README.md` dizem "nenhum ainda" quando já existem
itens reais. Não corrigido nesta execução (baixo risco, sem urgência).

## 10. Artefatos obsoletos ainda presentes

`metadata.json` (resíduo de outra ferramenta) e `skills-lock.json`
(lockfile do sistema HyperFrames, alheio a este projeto) continuam
versionados — confirmados sem nenhuma referência de código, seguros para
remoção quando alguém revisar este backlog.
