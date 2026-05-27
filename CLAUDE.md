# Fábrica de SaaS — Instruções para o Claude

## O que é este projeto

Sistema automatizado para criar, configurar e lançar SaaS completos usando IA. O objetivo é ter um processo repetível que vai desde a ideia até o produto online em produção, usando apenas ferramentas gratuitas ou de baixo custo.

## Contexto e objetivos

- **Público-alvo**: Empreendedores e desenvolvedores brasileiros que querem criar produtos digitais com baixo investimento inicial
- **Stack padrão**: React/Next.js + Supabase + Vercel + Cloudflare
- **Idioma**: Português brasileiro em toda a documentação e interfaces
- **Filosofia**: Infraestrutura gratuita no início, escalável conforme necessidade

## Estrutura do projeto

```
fabrica-saas/
├── CLAUDE.md              # Este arquivo — instruções para IA
├── .claude/               # Configurações do Claude Code
│   ├── memory/            # Memórias persistentes entre sessões
│   ├── skills/            # Skills customizados
│   ├── agents/            # Agentes especializados
│   └── commands/          # Comandos slash customizados
├── .credentials/          # Templates de credenciais (nunca commitar valores reais)
│   ├── financeiro/
│   ├── marketing/
│   ├── whatsapp/
│   ├── logistica/
│   ├── comunicacao/
│   └── infraestrutura/
├── infraestrutura/        # Guias de configuração gratuita
│   ├── vercel.md
│   ├── supabase.md
│   ├── render.md
│   ├── upstash.md
│   ├── uptimerobot.md
│   └── cloudflare.md
├── templates/             # Estruturas iniciais prontas
│   ├── saas-base/
│   ├── saas-b2b/
│   └── agente-base/
└── src/                   # Código da aplicação web
```

## Regras de desenvolvimento

### O que fazer sempre
- Escrever código limpo e sem comentários óbvios
- Usar TypeScript com tipagem estrita
- Validar inputs do usuário nas bordas do sistema (APIs, formulários)
- Seguir a estrutura de pastas estabelecida
- Commitar com mensagens claras em português

### O que nunca fazer
- Commitar arquivos `.env` ou credenciais reais
- Adicionar dependências sem necessidade clara
- Criar abstrações prematuras para código que só existe uma vez
- Deixar `console.log` de debug no código de produção

## Stack técnica

### Frontend
- **Framework**: React 18 + Vite (ou Next.js para novos projetos)
- **Estilo**: Tailwind CSS
- **Estado**: Zustand para estado global, useState para estado local
- **Formulários**: React Hook Form + Zod

### Backend
- **BaaS**: Supabase (auth, banco, storage, edge functions)
- **Deploy**: Vercel (frontend) ou Render (APIs Node.js)
- **Cache/Queue**: Upstash Redis
- **DNS/CDN**: Cloudflare

### Integrações frequentes
- **Pagamentos**: Stripe ou Mercado Pago
- **WhatsApp**: Evolution API (self-hosted) ou Z-API
- **Email**: Resend (gratuito até 3.000 emails/mês)
- **Monitoramento**: UptimeRobot (gratuito)

## Fluxo de trabalho

### Novo SaaS
1. Copiar template adequado (`saas-base` ou `saas-b2b`)
2. Configurar Supabase (banco + auth)
3. Configurar Vercel (deploy + domínio)
4. Configurar Cloudflare (DNS)
5. Configurar UptimeRobot (monitoramento)
6. Implementar features do produto

### Deploy
```bash
git push origin main  # Deploy automático via Vercel
```

### Banco de dados
- Usar migrations do Supabase para todas as alterações de schema
- Nunca alterar o banco direto em produção sem migration
- Testar em branch Supabase antes de aplicar em prod

## Variáveis de ambiente obrigatórias

Todo SaaS criado aqui precisa dessas variáveis configuradas:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Auth
NEXTAUTH_SECRET=
NEXTAUTH_URL=

# App
NEXT_PUBLIC_APP_URL=
NEXT_PUBLIC_APP_NAME=
```

## Comandos úteis

```bash
# Desenvolvimento local
npm run dev

# Build de produção
npm run build

# Verificar tipos TypeScript
npm run typecheck

# Supabase local
supabase start
supabase db diff     # ver mudanças pendentes
supabase db push     # aplicar migrations
```

## Regras de Eficiência de Tokens

Estas regras são obrigatórias em todas as sessões, sem exceção.

1. **Nunca repita informações já confirmadas** — se algo foi dito ou feito nesta sessão, não repita
2. **Nunca refaça tarefas já concluídas** — sempre verifique o que existe antes de criar qualquer coisa
3. **Sempre leia os arquivos existentes antes de qualquer ação** — nunca assuma o conteúdo
4. **Sempre execute em ordem lógica sem voltar atrás** — planeje antes, execute uma vez
5. **Respostas curtas e diretas** — sem introduções longas, sem resumos do que acabou de fazer
6. **Antes de criar qualquer arquivo verifique se já existe** — use Glob ou Read antes de Write
7. **Agrupe ações relacionadas num único comando** — um `git add` + `commit` juntos, não separados
8. **Nunca peça confirmação para ações já aprovadas como padrão** — commits, leitura de arquivos e criação de agentes são ações padrão aprovadas
9. **Use `/compact` quando o contexto estiver acima de 50%** — não espere o contexto encher
10. **Ao iniciar sessão nova leia `estado-atual.md` e continue de onde parou** — sem perguntar o que fazer, sem pedir contexto
11. **Para investigações amplas use subagentes** — `"Use subagents to investigate [tópico] and report back a summary"` — não explore a codebase inteira sozinho
12. **Edite apenas o trecho relevante** — nunca reescreva um arquivo inteiro quando só um bloco muda

## Fluxo de Sessão Recomendado

1. Ler `estado-atual.md` e identificar o próximo passo sem perguntar
2. Definir escopo claro antes de qualquer ação (arquivo + objetivo)
3. Trabalhar em uma tarefa focada por vez
4. Commitar no Git ao fim de cada tarefa concluída
5. Usar `/compact` após cada fase de trabalho
6. Usar `/clear` ao trocar para contexto completamente diferente
7. Atualizar `estado-atual.md` quando concluir uma fase significativa

## Checkpoints Git

- Commitar antes de iniciar qualquer refatoração grande
- Mensagens de commit em português, descritivas e no imperativo
- Commitar ao fim da sessão antes de usar `/clear`
- Não commitar `.claude/settings.local.json` (configurações locais)
- Nunca commitar arquivos `.env` ou credenciais reais

## Foco do Sprint Atual

> Atualizar a cada sessão com o que está em andamento.

### Fase atual: Skills e comandos slash
- [x] `configurar-agentes.md`
- [x] `configurar-auth.md`
- [x] `configurar-infraestrutura.md`
- [x] `configurar-whatsapp.md`
- [x] `pipeline-novo-saas.md`
- [x] `setup-pagamentos.md`
- [ ] `agente-dev.md` — agente que escreve código React/Supabase
- [ ] Migration Supabase para tabela `leads` e `orchestrator_logs`
- [ ] Configuração BullMQ com Upstash Redis
- [ ] Teste do fluxo completo: lead → SDR → financeiro → conciliação → operacional

## Contato e repositório

- **GitHub**: https://github.com/minhaautomacao/AI-SaaS-Factory-Fabrica-de-Saas
- **Email**: minhaautomacao10@gmail.com
