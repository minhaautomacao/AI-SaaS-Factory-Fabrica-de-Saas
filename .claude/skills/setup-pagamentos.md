# Skill: Setup de Pagamentos

## Descrição
Integra gateway de pagamento ao SaaS: Mercado Pago (recomendado para Brasil, com PIX) ou Stripe (internacional). Cobre checkout, webhooks, assinaturas e modo teste.

## Quando usar
- Na Etapa 6 do `pipeline-novo-saas.md`
- Ao adicionar pagamentos a um projeto existente
- Ao trocar de gateway de pagamento

---

## Escolha do gateway

| Critério | Mercado Pago | Stripe |
|---|---|---|
| PIX | ✅ Nativo | ❌ Não suporta |
| Boleto | ✅ | ❌ |
| Cartão crédito/débito | ✅ | ✅ |
| Taxa (crédito à vista) | ~3,99% | ~3,4% + R$ 0,60 |
| Documentação PT-BR | ✅ Excelente | ⚠️ Parcial |
| Sandbox | ✅ | ✅ |
| **Quando usar** | Público brasileiro, PIX obrigatório | Produto SaaS com faturamento recorrente internacional |

**Recomendação**: Mercado Pago para produtos com público brasileiro. Stripe para SaaS B2B ou clientes internacionais.

---

## Opção A — Mercado Pago (recomendado para floricultura)

### 1. Criar aplicação
1. Acessar [developers.mercadopago.com](https://developers.mercadopago.com)
2. Suas integrações → Criar aplicação
3. Anotar:
   - **Public Key** (frontend)
   - **Access Token** (backend)

### 2. Variáveis de ambiente
```env
MERCADOPAGO_ACCESS_TOKEN=[access-token-produção]
MERCADOPAGO_PUBLIC_KEY=[public-key-produção]
MERCADOPAGO_ACCESS_TOKEN_TEST=[access-token-sandbox]
MERCADOPAGO_PUBLIC_KEY_TEST=[public-key-sandbox]
MERCADOPAGO_WEBHOOK_SECRET=[secret-para-validar-webhook]
```

### 3. Instalar SDK
```bash
npm install mercadopago
```

### 4. Gerar PIX

Criar `lib/pagamentos/mercadopago.ts`:

```typescript
import { MercadoPagoConfig, Payment } from 'mercadopago'

const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN!,
})

export interface DadosPIX {
  valor: number
  descricao: string
  cliente_nome: string
  cliente_email: string
  cliente_cpf: string
  pedido_id: string
  validade_minutos?: number
}

export async function gerarPIX(dados: DadosPIX) {
  const payment = new Payment(client)

  const result = await payment.create({
    body: {
      transaction_amount: dados.valor,
      description: dados.descricao,
      payment_method_id: 'pix',
      date_of_expiration: new Date(
        Date.now() + (dados.validade_minutos || 30) * 60 * 1000
      ).toISOString(),
      payer: {
        email: dados.cliente_email,
        first_name: dados.cliente_nome.split(' ')[0],
        last_name: dados.cliente_nome.split(' ').slice(1).join(' '),
        identification: {
          type: 'CPF',
          number: dados.cliente_cpf,
        },
      },
      external_reference: dados.pedido_id,
    },
  })

  return {
    payment_id: result.id,
    chave_pix: result.point_of_interaction?.transaction_data?.qr_code,
    qr_code_base64: result.point_of_interaction?.transaction_data?.qr_code_base64,
    expira_em: result.date_of_expiration,
    status: result.status,
  }
}

export async function gerarLinkPagamento(dados: DadosPIX) {
  // Preference para link de checkout completo
  const { Preference } = await import('mercadopago')
  const preference = new Preference(client)

  const result = await preference.create({
    body: {
      items: [
        {
          title: dados.descricao,
          quantity: 1,
          currency_id: 'BRL',
          unit_price: dados.valor,
        },
      ],
      payer: {
        email: dados.cliente_email,
      },
      external_reference: dados.pedido_id,
      notification_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/pagamentos/webhook`,
      back_urls: {
        success: `${process.env.NEXT_PUBLIC_APP_URL}/pedido/${dados.pedido_id}/sucesso`,
        failure: `${process.env.NEXT_PUBLIC_APP_URL}/pedido/${dados.pedido_id}/falha`,
      },
    },
  })

  return {
    preference_id: result.id,
    link_pagamento: result.init_point,
    link_sandbox: result.sandbox_init_point,
  }
}
```

### 5. Webhook de confirmação

Criar `src/app/api/pagamentos/webhook/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { queueUrgente } from '@/lib/queues'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('x-signature') || ''

  // Validar assinatura do webhook
  if (!validarAssinatura(body, signature)) {
    return NextResponse.json({ error: 'Assinatura inválida' }, { status: 401 })
  }

  const evento = JSON.parse(body)

  if (evento.type === 'payment' && evento.action === 'payment.updated') {
    await queueUrgente.add('financeiro:pagamento_confirmado', {
      agente: 'financeiro',
      acao: 'pagamento_confirmado',
      payload: {
        payment_id: evento.data.id,
        gateway: 'mercadopago',
        evento_tipo: evento.type,
      },
      prioridade: 'urgente',
    })
  }

  return NextResponse.json({ ok: true })
}

function validarAssinatura(body: string, signature: string): boolean {
  const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET!
  const hash = crypto.createHmac('sha256', secret).update(body).digest('hex')
  return hash === signature
}
```

---

## Opção B — Stripe

### 1. Criar conta e coletar chaves
1. Acessar [stripe.com](https://stripe.com) → Dashboard → Developers → API Keys
2. Copiar chaves:
   - **Publishable key** (frontend)
   - **Secret key** (backend)

### 2. Variáveis de ambiente
```env
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY_TEST=sk_test_...
STRIPE_PUBLISHABLE_KEY_TEST=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### 3. Instalar SDK
```bash
npm install stripe @stripe/stripe-js
```

### 4. Criar link de pagamento / assinatura
```typescript
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function criarCheckoutSession(dados: {
  preco_id: string
  cliente_email: string
  pedido_id: string
  modo: 'payment' | 'subscription'
}) {
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [{ price: dados.preco_id, quantity: 1 }],
    mode: dados.modo,
    customer_email: dados.cliente_email,
    metadata: { pedido_id: dados.pedido_id },
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/pedido/${dados.pedido_id}/sucesso`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pedido/${dados.pedido_id}/cancelado`,
  })

  return { session_id: session.id, url: session.url }
}
```

### 5. Webhook Stripe
```typescript
import Stripe from 'stripe'
import { NextRequest, NextResponse } from 'next/server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(request: NextRequest) {
  const body = await request.text()
  const sig = request.headers.get('stripe-signature')!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch {
    return NextResponse.json({ error: 'Webhook inválido' }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.CheckoutSession
    await queueUrgente.add('financeiro:pagamento_confirmado', {
      agente: 'financeiro',
      acao: 'pagamento_confirmado',
      payload: {
        session_id: session.id,
        pedido_id: session.metadata?.pedido_id,
        valor: session.amount_total! / 100,
        gateway: 'stripe',
      },
    })
  }

  return NextResponse.json({ ok: true })
}
```

---

## Configurar webhook no painel do gateway

### Mercado Pago
Suas integrações → [Aplicação] → Webhooks:
- URL: `https://[dominio]/api/pagamentos/webhook`
- Eventos: `payment`

### Stripe
Developers → Webhooks → Add endpoint:
- URL: `https://[dominio]/api/pagamentos/webhook`
- Events: `checkout.session.completed`, `payment_intent.succeeded`

---

## Verificação final

```bash
# Mercado Pago — teste com credenciais sandbox
curl -X POST http://localhost:3000/api/pagamentos/pix \
  -H 'Content-Type: application/json' \
  -d '{"valor":1.00,"descricao":"Teste","cliente_nome":"Teste","cliente_email":"test@test.com","cliente_cpf":"12345678909","pedido_id":"test-001"}'

# Stripe — usar cartão de teste 4242 4242 4242 4242
```

✅ Pagamentos configurados, webhook recebendo confirmações.
