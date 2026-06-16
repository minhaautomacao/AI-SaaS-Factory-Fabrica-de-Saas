# WhatsApp via Z-API — Enemeop Flores

## Visão geral

O orquestrador recebe mensagens WhatsApp via webhook da Z-API e responde usando a IA Flora (Groq).
O fluxo completo: cliente envia mensagem → Z-API → `POST /webhook/whatsapp` → Flora responde → Z-API envia.

## Configuração inicial

### 1. Criar conta e instância na Z-API

1. Acesse [app.z-api.io](https://app.z-api.io) e crie uma conta
2. Clique em **Nova Instância** e dê um nome (ex: `floricultura`)
3. Escaneie o QR Code com o WhatsApp do número da floricultura `(11) 98282-9083`
4. Aguarde o status mudar para **Conectado**

### 2. Copiar as credenciais

No painel Z-API, colete:

| Variável | Onde encontrar |
|---|---|
| `ZAPI_INSTANCE_ID` | Instâncias > sua instância > **ID** |
| `ZAPI_TOKEN` | Instâncias > sua instância > **Token** |
| `ZAPI_CLIENT_TOKEN` | Minha Conta > **Client-Token** |

### 3. Configurar variáveis de ambiente

No Render (serviço `enemeop-orquestrador`), adicione:

```
WHATSAPP_PROVIDER=zapi
ZAPI_INSTANCE_ID=<valor copiado>
ZAPI_TOKEN=<valor copiado>
ZAPI_CLIENT_TOKEN=<valor copiado>
CARLOS_WHATSAPP=5511982829083
```

### 4. Cadastrar webhook na Z-API

No painel Z-API > sua instância > **Webhooks**:

- **URL de recebimento de mensagens:**
  ```
  https://enemeop-orquestrador.onrender.com/webhook/whatsapp
  ```
- Marcar apenas: `Mensagens recebidas` (ReceivedCallback)
- Salvar

## Formato do webhook Z-API

A Z-API envia `POST` com `Content-Type: application/json`:

```json
{
  "type": "ReceivedCallback",
  "phone": "5511999999999",
  "senderName": "Nome do Cliente",
  "fromMe": false,
  "text": {
    "message": "Quero comprar flores"
  },
  "messageId": "...",
  "instanceId": "..."
}
```

Eventos ignorados pelo orquestrador:
- `fromMe: true` — mensagens enviadas pelo próprio bot
- `isStatusReply: true` — atualizações de status
- Qualquer `type` diferente de `ReceivedCallback`

## Endpoint do webhook

```
POST /webhook/whatsapp
```

Resposta de sucesso: `200 { "received": true }`

O orquestrador responde 200 imediatamente e processa a mensagem de forma assíncrona (não bloqueia o webhook).

## Testes

Com o `.env` preenchido e o orquestrador rodando (`npm run dev`):

```bash
# Validar credenciais
npx tsx scripts/test-whatsapp.ts creds

# Testar parser de payload (sem rede)
npx tsx scripts/test-whatsapp.ts payload

# Enviar mensagem real para CARLOS_WHATSAPP
npx tsx scripts/test-whatsapp.ts enviar

# Simular webhook inbound (orquestrador deve estar rodando)
npx tsx scripts/test-whatsapp.ts webhook
```

## Checklist de produção

- [ ] Conta Z-API criada
- [ ] Instância criada e QR Code escaneado
- [ ] Status da instância: **Conectado**
- [ ] Variáveis adicionadas no Render
- [ ] Webhook cadastrado na Z-API apontando para o Render
- [ ] `npx tsx scripts/test-whatsapp.ts creds` — sem erros
- [ ] `npx tsx scripts/test-whatsapp.ts enviar` — mensagem recebida no celular
- [ ] Enviar mensagem manual do cliente → Flora responde no WhatsApp

## Migração futura para Meta Cloud API

O cliente WhatsApp está isolado em `src/lib/whatsapp.ts`. Para migrar:
1. Adicione um novo provider em `whatsapp.ts` com as mesmas funções exportadas
2. Troque `WHATSAPP_PROVIDER=meta` no `.env`
3. Nenhuma outra parte do sistema precisa mudar
