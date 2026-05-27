# Skill: Pipeline Novo SaaS

## Descrição
Orquestrador mestre da fábrica. Conduz o processo completo de criação de um novo SaaS do zero até produção, na ordem correta, verificando o que já existe antes de executar cada etapa.

## Quando usar
- Ao iniciar qualquer novo produto SaaS com esta fábrica
- Invocado automaticamente pelo comando `/novo-saas`
- Quando retomar um SaaS que foi iniciado mas não finalizado

---

## Etapa 0 — Definição do produto

Antes de qualquer código ou configuração, coletar:

```
Nome do SaaS:         _______________
Tipo de negócio:      [ ] Floricultura  [ ] E-commerce  [ ] B2B  [ ] Agente  [ ] Outro
Público-alvo:         _______________
Funcionalidades MVP:  _______________
Domínio desejado:     _______________
Stack de pagamento:   [ ] Mercado Pago  [ ] Stripe
WhatsApp necessário:  [ ] Sim  [ ] Não
Agentes necessários:  _______________
```

**Template a usar:**
- Negócio com clientes diretos (floricultura, e-commerce, serviços) → `saas-base`
- Empresa vendendo para outras empresas (workspaces, times) → `saas-b2b`
- Produto centrado em IA e agentes → `agente-base`

---

## Etapa 1 — Criar estrutura do projeto

```bash
# Copiar template escolhido
cp -r templates/[template-escolhido] ../[nome-do-saas]
cd ../[nome-do-saas]

# Inicializar repositório
git init
git add .
git commit -m "Início do projeto [nome] — baseado em [template]"
```

Criar `.env.local` a partir do `.env.example`:
```bash
cp .env.example .env.local
```

Criar `CLAUDE.md` para o novo SaaS com:
- Nome e descrição do produto
- Stack específica
- Regras de negócio do cliente
- Tom da marca
- Integrações necessárias

---

## Etapa 2 — Configurar infraestrutura

Executar skill `configurar-infraestrutura.md` na ordem:

1. **Supabase** — criar projeto, copiar URL e chaves para `.env.local`
2. **Vercel** — conectar repositório, configurar env vars
3. **Cloudflare** — adicionar domínio, configurar DNS apontando para Vercel
4. **Upstash** — criar instância Redis (se usar agentes ou filas)
5. **UptimeRobot** — adicionar monitor do domínio de produção

✅ Verificar: `npm run build` sem erros antes de avançar

---

## Etapa 3 — Configurar autenticação

Executar skill `configurar-auth.md`:

1. Criar tabela `profiles` no Supabase
2. Aplicar políticas RLS
3. Configurar providers de login
4. Gerar componentes de login/signup/logout
5. Proteger rotas privadas

✅ Verificar: login e logout funcionando em localhost

---

## Etapa 4 — Configurar agentes (se aplicável)

Executar skill `configurar-agentes.md`:

1. Identificar quais agentes são necessários para o tipo de negócio
2. Configurar filas BullMQ no Upstash
3. Definir variáveis de ambiente de cada agente
4. Testar comunicação entre agentes

✅ Verificar: orquestrador consegue enfileirar e receber jobs

---

## Etapa 5 — Configurar WhatsApp (se aplicável)

Executar skill `configurar-whatsapp.md`:

1. Escolher provedor: Evolution API (self-hosted) ou Z-API (cloud)
2. Criar instância e conectar número
3. Configurar webhooks apontando para a API do SaaS
4. Testar envio e recebimento de mensagem
5. Conectar ao Agente SDR

✅ Verificar: mensagem de teste recebida e processada pelo agente

---

## Etapa 6 — Configurar pagamentos

Executar skill `setup-pagamentos.md`:

1. Criar conta no gateway escolhido (Mercado Pago ou Stripe)
2. Instalar SDK e configurar chaves
3. Criar produtos e planos de preço
4. Configurar webhook de confirmação de pagamento
5. Testar pagamento em modo sandbox

✅ Verificar: pagamento de teste confirmado via webhook

---

## Etapa 7 — Primeiro deploy em produção

Executar skill `deploy-producao.md`:

1. Rodar checklist completo
2. Aplicar migrations no Supabase de produção
3. Confirmar env vars em produção no Vercel
4. Push para `main` → deploy automático
5. Verificar domínio funcionando com HTTPS

✅ Verificar: aplicação acessível no domínio final, login funcionando

---

## Etapa 8 — Pós-deploy

1. Confirmar UptimeRobot monitorando
2. Fazer cadastro de teste de ponta a ponta
3. Testar fluxo completo: lead → venda → pagamento → entrega (se aplicável)
4. Atualizar `CLAUDE.md` do novo SaaS com decisões tomadas
5. Criar primeiro commit de produção com tag de versão:
```bash
git tag v1.0.0
git push origin main --tags
```

---

## Checklist final

```
[ ] Projeto criado a partir do template correto
[ ] .env.local configurado com todas as chaves
[ ] Supabase: projeto criado + migrations aplicadas
[ ] Vercel: deploy ativo + domínio configurado
[ ] Cloudflare: DNS propagado + HTTPS ativo
[ ] Upstash: Redis configurado (se agentes ativos)
[ ] UptimeRobot: monitor ativo
[ ] Auth: login/logout funcionando
[ ] Pagamentos: webhook confirmado em sandbox
[ ] WhatsApp: instância conectada (se aplicável)
[ ] Agentes: orquestrador funcionando (se aplicável)
[ ] Fluxo completo testado de ponta a ponta
[ ] CLAUDE.md do novo SaaS atualizado
[ ] Tag v1.0.0 criada
```

---

## Tempo estimado por etapa

| Etapa | Tempo |
|---|---|
| Definição + template | 15 min |
| Infraestrutura | 30 min |
| Auth | 20 min |
| Agentes | 30 min |
| WhatsApp | 20 min |
| Pagamentos | 25 min |
| Deploy + verificação | 20 min |
| **Total** | **~2h 40min** |
