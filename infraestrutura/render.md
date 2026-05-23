# Render — Configuração Gratuita

## Visão geral

Plataforma de hospedagem para backends Node.js, Python, Go, Ruby, etc. Alternativa ao Heroku, com plano gratuito que suporta web services, cron jobs e bancos PostgreSQL.

## Limites do plano gratuito

| Recurso | Limite |
|---|---|
| Web Services | Ilimitados |
| Cron Jobs | Ilimitados |
| Static Sites | Ilimitados |
| PostgreSQL | 1 banco, 1 GB, 90 dias |
| RAM | 512 MB por serviço |
| CPU | Compartilhado |
| Inatividade | Dorme após 15 min sem tráfego |

> **Atenção**: Serviços gratuitos dormem após 15 minutos de inatividade e levam ~30s para acordar na primeira requisição. Use UptimeRobot para manter acordado, ou migre para o plano Individual ($7/mês) para serviços críticos.

## Quando usar Render vs Vercel

| Situação | Recomendado |
|---|---|
| Frontend React/Next.js | Vercel |
| API Node.js dedicada | Render |
| Workers/jobs em background | Render |
| WebSockets | Render |
| Scraping ou processos longos | Render |

## Configuração passo a passo

### 1. Criar conta

1. Acesse [render.com](https://render.com) → **Get Started for Free**
2. **Sign up with GitHub**
3. Autorize o acesso

### 2. Criar Web Service

1. Dashboard → **New → Web Service**
2. Conecte o repositório GitHub
3. Configure:
   - **Name**: nome-do-servico
   - **Region**: Oregon (US West) — mais próximo do Brasil
   - **Branch**: main
   - **Runtime**: Node
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `node dist/server.js`
4. **Instance Type**: Free
5. Adicione variáveis de ambiente
6. **Create Web Service**

### 3. Variáveis de ambiente

No painel do serviço → **Environment**:

```env
NODE_ENV=production
PORT=10000
DATABASE_URL=postgresql://...
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

> Render injeta `PORT` automaticamente. Use `process.env.PORT` no código.

### 4. Servidor Node.js para Render

```typescript
// server.ts
import express from 'express'

const app = express()
const PORT = process.env.PORT || 3000

app.use(express.json())

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`)
})

export default app
```

### 5. Cron Jobs gratuitos

Para tarefas agendadas (enviar emails, limpeza de dados, etc.):

1. **New → Cron Job**
2. Configure:
   - **Command**: `node scripts/tarefa.js`
   - **Schedule**: `0 9 * * *` (todo dia às 9h UTC)
3. **Instance Type**: Free

Exemplos de schedules:
```
0 * * * *      # todo hora
0 9 * * *      # todo dia às 9h UTC (6h BRT)
0 9 * * 1      # toda segunda às 9h UTC
0 9 1 * *      # todo primeiro dia do mês
```

### 6. Deploy automático

- Cada push para `main` faz deploy automático
- **Settings → Auto-Deploy**: pode desabilitar para fazer deploy manual
- Rollback: **Deploys → selecionar deploy anterior → Rollback**

### 7. Logs

```bash
# Via CLI (render-cli)
npm install -g @render-com/cli
render login
render logs --service nome-do-servico --tail
```

Ou no painel: **serviço → Logs**

## Manter serviço acordado

Configure no UptimeRobot um monitor HTTP para a rota `/health` a cada 10 minutos:

```
URL: https://nome-do-servico.onrender.com/health
Tipo: HTTP
Intervalo: 10 minutos
```

## Banco PostgreSQL gratuito

> O banco gratuito expira após 90 dias. Use Supabase para banco persistente gratuitamente.

Para banco temporário (dev/testes):
1. **New → PostgreSQL**
2. Copie a **Internal Database URL** para usar nos outros serviços do Render
3. Use a **External Database URL** para conexões de fora do Render

## Quando migrar para o pago

- **Individual** ($7/mês): sem sleep, 512 MB RAM, 0.5 CPU dedicado
- **Standard** ($25/mês): 2 GB RAM, 1 CPU dedicado, SLA 99.95%

Para a maioria dos SaaS iniciais, o plano Individual já resolve o problema do sleep sem custo excessivo.
