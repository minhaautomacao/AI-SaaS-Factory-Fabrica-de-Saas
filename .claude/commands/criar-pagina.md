---
name: criar-pagina
description: Cria uma nova página seguindo o padrão do projeto atual — pergunta nome e tipo, gera arquivo com layout correto e adiciona à navegação
---

# Criar Página

$ARGUMENTS

## O que este comando faz

Cria uma nova página no projeto atual seguindo exatamente os padrões de código e estrutura já estabelecidos. Não impõe padrão externo — lê o projeto para descobrir o padrão vigente.

## Passos

### 1. Entender o projeto atual

Antes de criar qualquer coisa, leia:
- `package.json` → qual framework (Next.js App Router, Pages Router, React + Vite)
- Uma página existente → qual estrutura de imports, layout, componentes usados
- O sistema de navegação atual → onde adicionar o link para a nova página

### 2. Coletar informações (pergunte ao usuário)

1. **Nome da página**: Como ela será chamada? (ex: "Pedidos", "Configurações", "Relatório Mensal")
2. **Tipo**: 
   - `listagem` — tabela ou grid de itens com filtros
   - `formulario` — criar ou editar um registro
   - `dashboard` — cards e gráficos com métricas
   - `detalhe` — informações completas de um registro
   - `publica` — sem autenticação (landing, preços, etc.)
3. **Dados que vai exibir**: Qual tabela do Supabase? Quais campos?
4. **Protegida?**: Requer usuário logado?

### 3. Criar o arquivo da página

Baseado no framework detectado:

**Next.js App Router:**
- Caminho: `app/[nome-kebab]/page.tsx`
- Usar `async/await` com Server Components quando não precisar de interatividade
- Usar `'use client'` apenas quando necessário (hooks, eventos)

**Next.js Pages Router:**
- Caminho: `pages/[nome-kebab].tsx`
- Usar `getServerSideProps` para dados dinâmicos
- Usar `getStaticProps` para dados estáticos

**React + Vite:**
- Caminho: `src/pages/[NomePagina].tsx`
- Adicionar rota em `src/router.tsx` (ou equivalente)

### 4. Estrutura por tipo de página

**Listagem:**
```typescript
// Inclui: busca, filtros, tabela/grid, paginação, botão de ação principal
// Dados: query ao Supabase com .select() + .order() + .range()
// Estado: filtros controlados com useState, dados com useEffect
```

**Formulário:**
```typescript
// Inclui: React Hook Form + Zod para validação
// Dados: buscar registro existente (edição) ou vazio (criação)
// Submit: upsert no Supabase → feedback de sucesso/erro → redirect
```

**Dashboard:**
```typescript
// Inclui: cards de métricas, gráficos (se aplicável), lista dos mais recentes
// Dados: queries paralelas com Promise.all
// Atualização: polling a cada 5min ou Supabase Realtime se crítico
```

**Detalhe:**
```typescript
// Inclui: todas as informações do registro, seções relacionadas, ações disponíveis
// Dados: select com joins das tabelas relacionadas
// Ações: botões que chamam mutations no Supabase
```

### 5. Adicionar à navegação

Localizar onde estão os links de navegação atuais (sidebar, navbar ou menu) e adicionar:
- Ícone (usar a biblioteca já presente no projeto)
- Label em português
- Rota correta
- Permissão (se o projeto tiver controle de acesso por papel)

### 6. Verificar tipos

```bash
npm run typecheck
```

Se o projeto não tiver `typecheck` no `package.json`, rodar `tsc --noEmit`.

### 7. Commitar

```bash
git add src/pages/ src/components/ src/router.tsx  # ajustar conforme framework
git commit -m "Adiciona página [Nome] com [tipo]"
```

## Referências

- Padrões de código: `CLAUDE.md` seção "Regras de desenvolvimento"
- Skill de auth (para rotas protegidas): `.claude/skills/configurar-auth.md`
- Schema do banco: `supabase/migrations/` (para saber quais tabelas existem)
