# Comandos Slash Customizados

Comandos `/slash` para acelerar tarefas frequentes no Claude Code.

## Comandos disponíveis

Nenhum comando customizado ainda. Adicione arquivos `.md` nesta pasta para criar novos comandos.

## Comandos planejados

### `/novo-saas`
Inicia o processo de criação de um novo SaaS:
1. Pergunta nome, nicho e público-alvo
2. Sugere funcionalidades do MVP
3. Cria estrutura de pastas baseada no template adequado
4. Configura Supabase e Vercel

### `/setup-auth`
Configura autenticação completa no projeto atual:
1. Cria tabela `profiles` no Supabase
2. Adiciona políticas RLS
3. Gera componentes de login/signup
4. Configura rotas protegidas

### `/criar-pagina`
Cria uma nova página com padrão do projeto:
1. Pergunta nome e tipo da página
2. Cria arquivo de página com layout padrão
3. Adiciona rota no sistema de navegação

### `/checklist-deploy`
Verifica se o projeto está pronto para produção:
1. Checa variáveis de ambiente
2. Verifica se há `console.log` de debug
3. Testa build de produção
4. Verifica configurações de segurança

## Como criar um comando

Crie um arquivo `nome-do-comando.md` com:

```markdown
---
name: nome-do-comando
description: O que este comando faz
---

# Nome do Comando

$ARGUMENTS

## Passos

1. Passo 1: faça isso
2. Passo 2: faça aquilo
```
