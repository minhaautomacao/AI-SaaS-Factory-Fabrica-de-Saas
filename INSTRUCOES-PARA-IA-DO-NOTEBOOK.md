# Instruções para a IA do Notebook
## Preparação completa do ambiente de desenvolvimento

---

Olá. Você é a IA responsável por configurar este notebook para que ele possa dar continuidade a um projeto de desenvolvimento de software que está sendo feito em outro computador (desktop). Este documento contém tudo que você precisa saber para deixar este notebook 100% alinhado com o projeto. Leia com atenção e execute cada etapa na ordem apresentada.

---

## CONTEXTO DO PROJETO

Estamos desenvolvendo dois produtos de software interligados:

**1. Fábrica de SaaS**
Sistema automatizado com inteligência artificial para criar e gerenciar produtos digitais. Possui 13 agentes de IA rodando em nuvem, um orquestrador de filas e um painel de controle web.

**2. Enemeop Flores**
Sistema de gestão para uma floricultura, criado pela fábrica acima. Já está funcionando em produção na internet. Tem telas de pedidos, leads, entregas, financeiro e agente de atendimento por IA. Este é o produto que será usado diretamente no cliente.

Ambos os projetos estão no GitHub e o notebook deve cloná-los e configurá-los localmente.

---

## PARTE 1 — SOFTWARES QUE PRECISAM ESTAR INSTALADOS

Verifique e instale cada item abaixo. Se já estiver instalado, apenas confirme a versão.

### Node.js
- Baixar em: https://nodejs.org
- Instalar a versão LTS (Long Term Support)
- Deve ser versão 20 ou superior
- Verificar com o comando: `node --version`

### Git
- Baixar em: https://git-scm.com
- Instalar com configurações padrão
- Verificar com o comando: `git --version`

### Visual Studio Code
- Baixar em: https://code.visualstudio.com
- Instalar normalmente
- Após instalar, abrir o VS Code e instalar as extensões:
  - **Claude Code** (buscar na aba de extensões pelo nome "Claude Code")
  - **Tailwind CSS IntelliSense**
  - **ESLint**

### Claude Code (ferramenta de linha de comando)
Após o Node.js estar instalado, abrir o terminal e executar:
```
npm install -g @anthropic-ai/claude-code
```
Verificar com o comando: `claude --version`

---

## PARTE 2 — CONFIGURAR O GIT COM OS DADOS DA CONTA

No terminal, executar os dois comandos abaixo para identificar os commits:
```
git config --global user.name "Minha Automacao"
git config --global user.email "minhaautomacao10@gmail.com"
```

---

## PARTE 3 — CLONAR OS PROJETOS DO GITHUB

Criar a pasta de trabalho e clonar os repositórios:

```
mkdir "Projetos Minha Automacao"
cd "Projetos Minha Automacao"

git clone https://github.com/minhaautomacao/AI-SaaS-Factory-Fabrica-de-Saas fabrica-saas

git clone https://github.com/minhaautomacao/enemeop-flores enemeop-flores
```

---

## PARTE 4 — INSTALAR DEPENDÊNCIAS DOS PROJETOS

Após clonar, instalar as dependências de cada projeto:

```
cd enemeop-flores
npm install
cd ..

cd fabrica-saas
npm install
cd orchestrator
npm install
cd ../..
```

---

## PARTE 5 — CRIAR OS ARQUIVOS DE VARIÁVEIS DE AMBIENTE

Estes arquivos contêm chaves secretas e por isso não estão no GitHub. Precisam ser criados manualmente.

### Arquivo 1: dentro da pasta `enemeop-flores`
Criar o arquivo chamado `.env.local` com o seguinte conteúdo exato:

```
NEXT_PUBLIC_SUPABASE_URL=https://gftnjvdvzgjkhwxnxnwl.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdmdG5qdmR2emdqa2h3eG54bndsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAwMjExNTMsImV4cCI6MjA5NTU5NzE1M30.zgX7BLR5u8f3MNA5kwUVk3P6bjSWEjf9AZP0ksLjvY4
```

### Arquivo 2: dentro da pasta `fabrica-saas/orchestrator`
Criar o arquivo chamado `.env` com o seguinte conteúdo. Os campos marcados com `<preencher>` precisam ser buscados nos painéis das plataformas indicadas:

```
SUPABASE_URL=https://ebeapnydeiwuewxatuuw.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<pegar em supabase.com > projeto ebeapnydeiwuewxatuuw > Settings > API > service_role>
UPSTASH_REDIS_URL=<pegar em upstash.com > banco Redis do projeto > Details>
UPSTASH_REDIS_TOKEN=<pegar em upstash.com > banco Redis do projeto > Details>
```

---

## PARTE 6 — LOGINS NAS PLATAFORMAS

A pessoa que usa este notebook precisará fazer login nas plataformas abaixo. Todas as contas já existem — é só acessar com as credenciais do projeto.

### GitHub
- Site: https://github.com
- Conta: minhaautomacao
- Email: minhaautomacao10@gmail.com
- Os dois repositórios do projeto ficam nesta conta

### Supabase (banco de dados e inteligência artificial em nuvem)
- Site: https://supabase.com
- Email de login: minhaautomacao10@gmail.com
- Existem dois projetos:
  - **Fábrica de SaaS** — ID: `ebeapnydeiwuewxatuuw` — painel em: https://supabase.com/dashboard/project/ebeapnydeiwuewxatuuw
  - **Enemeop Flores** — ID: `gftnjvdvzgjkhwxnxnwl` — painel em: https://supabase.com/dashboard/project/gftnjvdvzgjkhwxnxnwl

### Vercel (hospedagem dos sites em produção)
- Site: https://vercel.com
- Email de login: minhaautomacao10@gmail.com
- Dois projetos ativos:
  - Fábrica: https://fabrica-saas.vercel.app
  - Enemeop Flores: https://enemeop-flores.vercel.app
- O deploy é automático — qualquer `git push` no GitHub atualiza o site em produção

### Console da Anthropic (IA — Claude)
- Site: https://console.anthropic.com
- Email de login: minhaautomacao10@gmail.com
- Aqui ficam as chaves de API do Claude e o histórico de uso
- O Claude Code (ferramenta instalada no Passo 1) usará esta conta

### Upstash (banco de filas Redis)
- Site: https://upstash.com
- Email de login: minhaautomacao10@gmail.com
- Há um banco Redis criado para o orquestrador da fábrica
- As chaves Redis ficam aqui e precisam ir para o arquivo `.env` do orchestrator

---

## PARTE 7 — AUTENTICAR O CLAUDE CODE

Após instalar o Claude Code, abrir o terminal dentro da pasta do projeto e executar:
```
claude
```

Na primeira execução ele vai abrir o browser pedindo autenticação. Fazer login com a conta `minhaautomacao10@gmail.com` no console da Anthropic. Após autenticar, o Claude Code estará pronto para usar.

Quando o Claude Code iniciar dentro da pasta `fabrica-saas` ou `enemeop-flores`, ele lê automaticamente as instruções do projeto e as memórias salvas. Todo o histórico de decisões e estado atual do projeto está no arquivo `.claude/memory/estado-atual.md` dentro do repositório.

---

## PARTE 8 — VERIFICAR QUE ESTÁ TUDO FUNCIONANDO

Após seguir todos os passos anteriores, verificar:

**Teste 1 — Rodar o Enemeop localmente:**
```
cd enemeop-flores
npm run dev
```
Abrir http://localhost:3000/login no browser.
Fazer login com: `contato@enemeopflores.com.br` / `12345678`
Se aparecer o painel de controle, está funcionando.

**Teste 2 — Verificar produção:**
Acessar https://enemeop-flores.vercel.app/login com as mesmas credenciais.

**Teste 3 — Abrir o Claude Code:**
```
cd enemeop-flores
claude
```
O Claude deve responder e mostrar o contexto do projeto.

---

## PARTE 9 — REGRA FUNDAMENTAL DO PROJETO

Este notebook e o desktop de desenvolvimento trabalham no **mesmo projeto**. Não existe versão separada — existe uma única versão no GitHub que os dois computadores compartilham.

**A regra é:**

Ao COMEÇAR a trabalhar neste notebook:
```
git pull origin main
```

Ao TERMINAR o trabalho neste notebook:
```
git add .
git commit -m "Descrição do que foi feito"
git push origin main
```

Nunca comece sem puxar. Nunca termine sem empurrar. Assim os dois computadores ficam sempre sincronizados e o trabalho de um complementa o trabalho do outro, sem duplicações nem conflitos.

---

## RESUMO — Checklist de configuração

Execute item por item e marque quando concluído:

```
[ ] Node.js instalado (versão 20+)
[ ] Git instalado
[ ] VS Code instalado com extensão Claude Code
[ ] Claude Code CLI instalado: npm install -g @anthropic-ai/claude-code
[ ] Git configurado com nome e email da conta
[ ] Repositório fabrica-saas clonado
[ ] Repositório enemeop-flores clonado
[ ] npm install executado nos dois projetos e no orchestrator
[ ] Arquivo enemeop-flores/.env.local criado com as chaves Supabase
[ ] Arquivo fabrica-saas/orchestrator/.env criado
[ ] Login feito no GitHub (minhaautomacao10@gmail.com)
[ ] Login feito no Supabase (minhaautomacao10@gmail.com)
[ ] Login feito no Vercel (minhaautomacao10@gmail.com)
[ ] Login feito no console da Anthropic (minhaautomacao10@gmail.com)
[ ] Login feito no Upstash (minhaautomacao10@gmail.com)
[ ] Claude Code autenticado com a conta Anthropic
[ ] Teste local do enemeop funcionando em localhost:3000
[ ] Login no site de produção testado em enemeop-flores.vercel.app
```

Quando todos os itens estiverem marcados, o notebook está pronto para dar continuidade ao projeto.

---

*Documento gerado em 2026-05-31 a partir do desktop de desenvolvimento.*
*Conta principal do projeto: minhaautomacao10@gmail.com*
