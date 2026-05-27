---
name: checklist-deploy
description: Verifica se o projeto está pronto para produção — variáveis de ambiente, segurança, build, tipos e configurações críticas
---

# Checklist de Deploy

$ARGUMENTS

## O que este comando faz

Executa uma revisão completa antes de ir para produção. Cada item é verificado ativamente (não apenas listado) — lendo arquivos, rodando comandos e reportando o resultado.

## Verificações

### 1. Código limpo

Verifique e reporte cada item:

```bash
# Console.logs de debug
grep -r "console\.log" src/ --include="*.ts" --include="*.tsx" | grep -v "// "
```
- [ ] Nenhum `console.log` de debug no código (comentados são OK)
- [ ] Nenhum `TODO` ou `FIXME` crítico não resolvido
- [ ] Nenhum arquivo `.env` ou credencial real commitada (`git log --oneline -20`)

### 2. TypeScript sem erros

```bash
npm run typecheck
```
- [ ] Zero erros de tipo
- [ ] Sem uso de `any` não justificado

### 3. Build de produção

```bash
npm run build
```
- [ ] Build conclui sem erros
- [ ] Nenhum warning crítico de bundle (chunks > 500kb sem lazy loading)

### 4. Variáveis de ambiente

Ler `.env.example` e verificar se todas as variáveis obrigatórias estão documentadas:

- [ ] `NEXT_PUBLIC_SUPABASE_URL` — presente no `.env.example`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` — presente no `.env.example`
- [ ] `SUPABASE_SERVICE_ROLE_KEY` — presente no `.env.example`
- [ ] `NEXT_PUBLIC_APP_URL` — presente no `.env.example`
- [ ] Variáveis de pagamento (Stripe/MP) — se o projeto usa billing

Verificar no Vercel (ou Render) se todas estão configuradas:
```
Acesse: vercel.com/[projeto]/settings/environment-variables
Confirme que todas as variáveis do .env.example existem lá
```

### 5. Segurança do banco de dados

```bash
# Via Supabase MCP ou Dashboard
# Verificar tabelas sem RLS habilitado
```

- [ ] RLS habilitado em todas as tabelas com dados de usuário
- [ ] Nenhuma chave `service_role` exposta no frontend (grep em arquivos `public/` e `src/`)
- [ ] `anon_key` usada apenas para operações autorizadas por RLS

```bash
grep -r "service_role" src/ public/ --include="*.ts" --include="*.tsx" --include="*.js"
```

### 6. Segurança da aplicação

- [ ] Inputs de formulário validados com Zod antes de qualquer operação no banco
- [ ] Rotas de API com validação de autenticação (não confiar apenas no frontend)
- [ ] Nenhuma query SQL montada com concatenação de string (usar parâmetros do Supabase)

### 7. Configuração de produção

- [ ] `NEXT_PUBLIC_APP_URL` aponta para o domínio de produção (não `localhost`)
- [ ] Supabase: Email templates configurados (confirmação, reset de senha)
- [ ] Supabase: Domínio de produção adicionado em Authentication > URL Configuration
- [ ] Vercel: Domínio customizado configurado (se aplicável)
- [ ] Cloudflare: DNS apontando para Vercel (se usar domínio próprio)

### 8. Monitoramento

- [ ] UptimeRobot: monitor HTTP configurado para a URL de produção
- [ ] Vercel: notificações de deploy habilitadas (email ou Slack)

### 9. Migrations aplicadas

```bash
supabase db diff  # deve retornar vazio (nenhuma migration pendente)
```
- [ ] Nenhuma migration pendente que não foi aplicada em produção

### 10. Git

```bash
git status
git log --oneline -5
```
- [ ] Sem mudanças não commitadas
- [ ] Branch `main` está sincronizada com o remoto (`git status` mostra "up to date")

## Resultado

Ao final, gere um relatório:

```
✅ APROVADO — X de Y verificações passaram
⚠️  ATENÇÃO — Itens que precisam de revisão antes do deploy
❌ BLOQUEADOR — Itens que impedem o deploy

[Lista de itens pendentes com instrução de como resolver]
```

Se houver bloqueadores, NÃO fazer push para `main`. Resolver primeiro.

## Referências

- Variáveis obrigatórias: `CLAUDE.md` seção "Variáveis de ambiente obrigatórias"
- Guia Vercel: `infraestrutura/vercel.md`
- Guia Supabase: `infraestrutura/supabase.md`
- Guia Cloudflare: `infraestrutura/cloudflare.md`
- Guia UptimeRobot: `infraestrutura/uptimerobot.md`
