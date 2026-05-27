---
name: novo-saas
description: Inicia o processo completo de criação de um novo SaaS — do nome à estrutura funcional pronta para desenvolvimento
---

# Novo SaaS

$ARGUMENTS

## O que este comando faz

Guia o processo de criação de um novo SaaS do zero, desde a definição do produto até a estrutura de código pronta para desenvolvimento.

## Passos

### 1. Coletar informações do produto

Pergunte ao usuário (uma pergunta por vez, espere a resposta):

1. **Nome do SaaS**: Qual é o nome do produto?
2. **Nicho**: Qual problema ele resolve? Para quem?
3. **Público-alvo**: B2C (usuários individuais) ou B2B (empresas/workspaces)?
4. **Features do MVP**: Quais são as 3 funcionalidades mais importantes para o v1?
5. **Monetização**: Assinatura mensal, por uso, ou freemium?

### 2. Selecionar template

Com base nas respostas:
- **B2C simples** → `templates/saas-base/` (auth + dashboard + billing individual)
- **B2B multi-tenant** → `templates/saas-b2b/` (workspaces + convites + billing por org)
- **Produto com IA embarcada** → `templates/agente-base/` (chat + streaming + memória)

Explique ao usuário qual template foi selecionado e por quê.

### 3. Criar estrutura de pastas

Copie o template para `projetos/[nome-kebab-case]/` e customize:
- `package.json`: nome, versão `0.1.0`, descrição
- `.env.example`: todas as variáveis com comentários explicando onde obtê-las
- `README.md`: nome do projeto, stack, variáveis, comandos básicos

### 4. Definir schema do banco

Com base nas features do MVP, proponha as tabelas principais:
- Listar entidades do domínio (ex: produtos, pedidos, clientes)
- Indicar relacionamentos
- Marcar quais precisam de RLS imediato
- Criar arquivo `supabase/migrations/[timestamp]_initial.sql`

### 5. Configurar infraestrutura (checklist)

Informe ao usuário o que precisa ser configurado manualmente:

```
[ ] Supabase: criar projeto em supabase.com → copiar URL e chaves para .env
[ ] Vercel: conectar repositório → adicionar variáveis de ambiente
[ ] Cloudflare: apontar domínio para Vercel (se já tiver domínio)
[ ] UptimeRobot: adicionar monitor HTTP para a URL de produção
```

Referencie os guias em `infraestrutura/` para cada serviço.

### 6. Próximos passos

Ao final, liste:
1. Qual feature implementar primeiro (baseado nas prioridades definidas)
2. Quais integrações de pagamento configurar
3. Estimativa de tempo para MVP funcional

## Referências

- Templates: `templates/saas-base/`, `templates/saas-b2b/`, `templates/agente-base/`
- Infraestrutura: `infraestrutura/supabase.md`, `infraestrutura/vercel.md`
- Agente de dev: `.claude/agents/agente-dev.md`
- Stack padrão: `.claude/memory/stack.md`
