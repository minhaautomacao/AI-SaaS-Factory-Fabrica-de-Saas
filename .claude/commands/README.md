# Comandos Slash Customizados

Comandos `/slash` para acelerar tarefas frequentes no Claude Code.

## Comandos disponíveis

## Comandos disponíveis

### `/novo-saas`
Guia completo para criar um SaaS do zero: coleta nome/nicho/público, seleciona template, cria estrutura de pastas, define schema do banco e gera checklist de infraestrutura.

### `/setup-auth`
Configura autenticação completa com Supabase: migration com tabela `profiles` + RLS + trigger, hook `useAuth`, componentes de login/signup e rotas protegidas.

### `/criar-pagina`
Cria uma nova página seguindo o padrão já existente no projeto: detecta o framework, pergunta nome e tipo (listagem/formulário/dashboard/detalhe), gera o arquivo e adiciona à navegação.

### `/checklist-deploy`
Verifica ativamente se o projeto está pronto para produção: TypeScript, build, variáveis de ambiente, RLS, segurança de código, migrations e monitoramento. Gera relatório com bloqueadores.

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
