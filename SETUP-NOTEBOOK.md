# Guia de Configuração do Notebook
## Projeto: Fábrica de SaaS + Enemeop Flores

> **Para quem:** Quem está configurando o notebook para continuar o projeto.
> **Objetivo:** Deixar o notebook 100% igual ao desktop de desenvolvimento, pronto para trabalhar diretamente no cliente.
> **Data do documento:** 2026-05-31

---

## O que é este projeto

Você está ingressando em dois projetos interligados:

1. **Fábrica de SaaS** — infraestrutura automatizada com IA para criar e gerenciar produtos digitais. Tem 13 agentes de inteligência artificial rodando no Supabase, um orquestrador de filas e um dashboard de controle.

2. **Enemeop Flores** — primeiro SaaS criado pela fábrica. Sistema de gestão para uma floricultura: pedidos, leads, entregas, financeiro e agente IA de atendimento. Já está em produção online.

---

## PARTE 1 — SOFTWARES A INSTALAR

Instale na ordem abaixo antes de qualquer outra coisa.

### 1.1 Node.js
- Site: https://nodejs.org
- Baixe a versão **LTS** (atualmente v20 ou superior)
- Durante a instalação, marque a opção de adicionar ao PATH
- Verificar instalação: abra o terminal e digite `node --version`

### 1.2 Git
- Site: https://git-scm.com
- Instale com as opções padrão
- Verificar: `git --version`

### 1.3 Visual Studio Code
- Site: https://code.visualstudio.com
- Instale normalmente
- Extensões recomendadas (instalar dentro do VS Code):
  - **Claude Code** (extensão oficial da Anthropic — buscar por "Claude Code")
  - **Tailwind CSS IntelliSense**
  - **TypeScript + JavaScript**

### 1.4 Claude Code (CLI)
Após instalar o Node.js, abra o terminal e execute:
```bash
npm install -g @anthropic-ai/claude-code
```
Verificar: `claude --version`

---

## PARTE 2 — ACESSOS E CONTAS NECESSÁRIAS

Você vai precisar fazer login em cada uma dessas plataformas. Todas as contas já existem — é só fazer login com as credenciais do projeto.

### 2.1 GitHub
- Site: https://github.com
- Conta: **minhaautomacao** (minhaautomacao10@gmail.com)
- Repositórios do projeto:
  - `https://github.com/minhaautomacao/AI-SaaS-Factory-Fabrica-de-Saas`
  - `https://github.com/minhaautomacao/enemeop-flores`
- Configure o Git local com:
```bash
git config --global user.name "Minha Automacao"
git config --global user.email "minhaautomacao10@gmail.com"
```

### 2.2 Console da Anthropic (Claude IA)
- Site: https://console.anthropic.com
- Login com a conta: minhaautomacao10@gmail.com
- O que você vai encontrar aqui:
  - A **API Key** que o Claude Code usa para funcionar
  - Histórico de uso e custos
- Após logar no Claude Code pelo terminal (`claude`), ele vai pedir autenticação — use esta mesma conta

### 2.3 Supabase (banco de dados + autenticação + edge functions)
- Site: https://supabase.com
- Login com: minhaautomacao10@gmail.com
- Existem **dois projetos** no Supabase:

| Projeto | ID | Finalidade |
|---|---|---|
| minhaautomacao-Saas | `ebeapnydeiwuewxatuuw` | Fábrica de SaaS (agentes IA) |
| enemeop-flores | `gftnjvdvzgjkhwxnxnwl` | SaaS da floricultura |

- Em cada projeto, vá em **Settings > API** para encontrar as chaves (você vai precisar delas no Passo 4)

### 2.4 Vercel (hospedagem / deploy)
- Site: https://vercel.com
- Login com: minhaautomacao10@gmail.com
- Projetos ativos:
  - `fabrica-saas` → https://fabrica-saas.vercel.app
  - `enemeop-flores` → https://enemeop-flores.vercel.app
- Qualquer `git push` no GitHub faz deploy automático no Vercel — não precisa fazer nada manual

### 2.5 Upstash (fila Redis para o orquestrador)
- Site: https://upstash.com
- Login com: minhaautomacao10@gmail.com
- Tem um banco Redis criado para a fábrica
- Você vai precisar da **UPSTASH_REDIS_URL** e **UPSTASH_REDIS_TOKEN** (ficam no painel do banco)
- Necessário apenas para rodar o orquestrador local (não urgente)

---

## PARTE 3 — CLONAR OS PROJETOS

Abra o terminal e execute:

```bash
# Crie a pasta de trabalho (mesmo nome do desktop)
mkdir "Projetos Minha Automacao"
cd "Projetos Minha Automacao"

# Clone os dois projetos
git clone https://github.com/minhaautomacao/AI-SaaS-Factory-Fabrica-de-Saas fabrica-saas
git clone https://github.com/minhaautomacao/enemeop-flores enemeop-flores
```

---

## PARTE 4 — INSTALAR DEPENDÊNCIAS

```bash
# --- Projeto Enemeop Flores ---
cd enemeop-flores
npm install

# --- Projeto Fábrica de SaaS ---
cd ../fabrica-saas
npm install

# Orquestrador (sub-pasta separada)
cd orchestrator
npm install
cd ..
```

---

## PARTE 5 — VARIÁVEIS DE AMBIENTE

Estas informações **não ficam no GitHub** por segurança. Você precisa criar os arquivos manualmente.

### 5.1 Enemeop Flores — arquivo `.env.local`

Crie o arquivo `enemeop-flores/.env.local` com o conteúdo abaixo:

```env
NEXT_PUBLIC_SUPABASE_URL=https://gftnjvdvzgjkhwxnxnwl.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdmdG5qdmR2emdqa2h3eG54bndsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAwMjExNTMsImV4cCI6MjA5NTU5NzE1M30.zgX7BLR5u8f3MNA5kwUVk3P6bjSWEjf9AZP0ksLjvY4
```

### 5.2 Fábrica — arquivo `orchestrator/.env`

Crie o arquivo `fabrica-saas/orchestrator/.env`. Os valores você pega nas plataformas:

```env
# Supabase fábrica — pegar em supabase.com > projeto ebeapnydeiwuewxatuuw > Settings > API
SUPABASE_URL=https://ebeapnydeiwuewxatuuw.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<colar aqui a service_role key>

# Upstash Redis — pegar em upstash.com > seu banco > Details
UPSTASH_REDIS_URL=<colar aqui>
UPSTASH_REDIS_TOKEN=<colar aqui>
```

---

## PARTE 6 — TESTAR QUE ESTÁ FUNCIONANDO

### Testar o Enemeop Flores localmente:
```bash
cd enemeop-flores
npm run dev
```
Abra http://localhost:3000/login no browser.
Login: `contato@enemeopflores.com.br` / `12345678`

Se aparecer o dashboard → tudo certo.

### Testar o site em produção:
Acesse https://enemeop-flores.vercel.app/login com as mesmas credenciais.

---

## PARTE 7 — CONFIGURAR O CLAUDE CODE

Abra o VS Code na pasta do projeto:
```bash
code "Projetos Minha Automacao/enemeop-flores"
```

No terminal do VS Code, inicie o Claude Code:
```bash
claude
```

Na primeira vez vai pedir para fazer login na conta Anthropic. Use `minhaautomacao10@gmail.com`. Após autenticar, o Claude Code já carrega automaticamente as instruções do projeto (arquivo `CLAUDE.md`) e as memórias salvas (pasta `.claude/memory/`).

> **Importante:** Todo o contexto do projeto — o que foi feito, o que está pendente, as decisões tomadas — está salvo em `.claude/memory/estado-atual.md`. O Claude Code lê isso automaticamente ao iniciar.

---

## PARTE 8 — ESTADO ATUAL DO PROJETO E PRÓXIMOS PASSOS

### O que já está pronto e funcionando

| Entregável | Status |
|---|---|
| Dashboard Enemeop (pedidos, leads, entregas, financeiro, configurações) | ✅ Em produção |
| Banco de dados Supabase (profiles, pedidos, leads) | ✅ Aplicado |
| Deploy automático via Vercel | ✅ Ativo |
| 13 agentes IA na Fábrica (Supabase Edge Functions) | ✅ Deployados |
| Dashboard da Fábrica de SaaS | ✅ Em produção |
| Template `saas-base` para novos projetos | ✅ Criado |

### O que está pendente

**Prioridade 1 — Enemeop Flores (cliente ativo):**
- [ ] Confirmar que o login funciona no browser (testar manualmente — pode já estar resolvido)
- [ ] Inserir credenciais reais da empresa em `/dashboard/configuracoes` (WhatsApp, integrações)
- [ ] Validar fluxo completo: criar pedido → acompanhar entrega → financeiro

**Prioridade 2 — Fábrica de SaaS:**
- [ ] Preencher `orchestrator/.env` com credenciais reais do Supabase + Upstash
- [ ] Rodar `npm run dev` no orchestrator e validar filas BullMQ
- [ ] Configurar `WHATSAPP_OLD_SYSTEM_WEBHOOK` no Vercel para o proxy WhatsApp funcionar

**Prioridade 3 — Evolução do produto Enemeop:**
- [ ] Integrar WhatsApp para receber pedidos automaticamente
- [ ] Ativar agente IA de atendimento
- [ ] Configurar pagamentos (Mercado Pago ou Stripe)

---

## PARTE 9 — FLUXO DE TRABALHO NO DIA A DIA

### Ao começar o trabalho no notebook:
```bash
cd "Projetos Minha Automacao/enemeop-flores"
git pull origin main   # sempre puxar as atualizações primeiro
npm run dev            # rodar local se necessário
claude                 # abrir o Claude Code
```

### Ao terminar o trabalho:
```bash
git add .
git commit -m "Descrição do que foi feito"
git push origin main
```

O Vercel faz o deploy automático após o push — em 1-2 minutos o site em produção já está atualizado.

### Regra importante:
**Nunca trabalhe nos dois computadores ao mesmo tempo sem sincronizar.** Sempre `git pull` antes de começar e `git push` ao terminar. Assim desktop e notebook ficam sempre sincronizados.

---

## RESUMO RÁPIDO — Checklist de configuração

```
[ ] Instalar Node.js (nodejs.org)
[ ] Instalar Git (git-scm.com)
[ ] Instalar VS Code (code.visualstudio.com)
[ ] npm install -g @anthropic-ai/claude-code
[ ] git clone fabrica-saas
[ ] git clone enemeop-flores
[ ] npm install nos dois projetos + orchestrator
[ ] Criar enemeop-flores/.env.local com as chaves Supabase
[ ] Criar fabrica-saas/orchestrator/.env com as chaves
[ ] Logar no Claude Code com minhaautomacao10@gmail.com
[ ] Testar npm run dev no enemeop-flores
[ ] Testar login em localhost:3000/login
```

---

*Documento gerado em 2026-05-31. Dúvidas: minhaautomacao10@gmail.com*
