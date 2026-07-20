# Guia — Criar um novo SaaS a partir da Fábrica

> A Enemeop Flores é citada aqui apenas como origem histórica da
> necessidade que motivou este guia — não como dependência técnica. Nenhum
> passo abaixo assume a existência do repositório da Enemeop nem reaproveita
> arquivos específicos dela.

## Fluxo

### 1. Criar novo repositório
Repositório próprio, fora da Fábrica, um por cliente (mesmo padrão adotado
para o repositório da aplicação do cliente: código de produto e dados
operacionais vivem lá, nunca na Fábrica).

### 2. Selecionar módulos
Escolher, entre os agentes genéricos (`.claude/agents/*.md`) e adaptadores
disponíveis (canais, catálogo, pagamento, logística), quais o novo cliente
precisa. Nem todo cliente usa todos os 13 agentes.

### 3. Gerar estrutura
Usar `scripts/criar-saas.ts` e os templates em `templates/` (`saas-base`,
`saas-b2b`, `agente-base`) como ponto de partida. A estrutura gerada não
deve conter nenhum dado do novo cliente ainda — só placeholders.

### 4. Configurar identidade do cliente
Nome do cliente, nome do agente/assistente, segmento de negócio: tudo
entra como configuração (registro em `workspaces`, variáveis de ambiente
do novo repositório), nunca como edição direta de string em código
genérico.

### 5. Inserir credenciais fora do Git
Criar `.credentials/<categoria>/.env` no repositório do novo cliente,
seguindo o mesmo padrão de allowlist do `.gitignore` já em uso (ver
`docs/CLIENT_ISOLATION_POLICY.md` seção 2). Nenhuma credencial passa pelo
Git em nenhum momento.

### 6. Configurar provedores
Ativar e configurar, por workspace, os provedores escolhidos (canal de
atendimento, pagamento, logística, IA) via `workspace_credentials` e/ou
env vars do novo repositório.

### 7. Aplicar migrations
Aplicar o schema base multi-tenant (`workspaces`, `workspace_credentials`,
`leads`, `orchestrator_logs`) no projeto Supabase do novo cliente, mais
qualquer migration específica do domínio do novo cliente (que vive no
repositório dele, não na Fábrica).

### 8. Testar
Rodar localmente (`npm run dev` do frontend, orquestrador local com Redis
de teste) antes de qualquer deploy. Confirmar que os agentes ativados
respondem com a configuração do novo cliente, não com valores de exemplo.

### 9. Implantar
Deploy do frontend (Vercel), backend/orquestrador (Render), Edge Functions
(Supabase) — cada um no projeto/conta correta do novo cliente, nunca
reaproveitando o projeto Supabase ou o serviço Render de outro cliente
(erro já cometido uma vez: ver `enemeop-flores/docs/INFRASTRUCTURE_MAP.md`,
onde Edge Functions da Enemeop acabaram deployadas também no projeto
Supabase da própria Fábrica).

### 10. Validar isolamento
Rodar o checklist de `docs/CLIENT_ISOLATION_POLICY.md` seção 9 antes de
considerar a criação concluída: nenhum dado do novo cliente deve ter
vazado de volta para a Fábrica durante o processo, e nenhuma credencial ou
projeto de infraestrutura deve estar compartilhado com outro cliente.
