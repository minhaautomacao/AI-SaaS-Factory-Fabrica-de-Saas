# Credenciais Financeiras

> **NUNCA commitar valores reais nesta pasta.** Apenas os arquivos README.md são versionados.

## Como usar

Crie um arquivo `.env` local nesta pasta com as credenciais reais:

```env
# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Stripe (teste)
STRIPE_TEST_SECRET_KEY=sk_test_...
STRIPE_TEST_PUBLISHABLE_KEY=pk_test_...

# Mercado Pago
MERCADOPAGO_ACCESS_TOKEN=
MERCADOPAGO_PUBLIC_KEY=
MERCADOPAGO_WEBHOOK_SECRET=

# Asaas (alternativa BR)
ASAAS_API_KEY=
ASAAS_WEBHOOK_TOKEN=
```

## Ambientes

Sempre use credenciais de **teste** em desenvolvimento local. Nunca use chaves de produção fora do servidor de produção.

## Stripe — onde obter

1. [dashboard.stripe.com](https://dashboard.stripe.com)
2. **Developers → API Keys**
3. Para webhook: **Developers → Webhooks → Add endpoint**

## Mercado Pago — onde obter

1. [mercadopago.com.br/developers](https://www.mercadopago.com.br/developers)
2. **Suas integrações → Credenciais**
3. Para webhook: **Webhooks → Adicionar**

## Eventos de webhook para configurar

**Stripe**:
- `checkout.session.completed`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_failed`

**Mercado Pago**:
- `payment` (created, updated)
- `subscription_preapproval`
