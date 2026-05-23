# Credenciais de Logística

> **NUNCA commitar valores reais nesta pasta.** Apenas os arquivos README.md são versionados.

## Como usar

Crie um arquivo `.env` local nesta pasta com as credenciais reais:

```env
# Melhor Envio (cotação e geração de etiquetas)
MELHORENVIO_CLIENT_ID=
MELHORENVIO_CLIENT_SECRET=
MELHORENVIO_TOKEN=

# ViaCEP (gratuito, sem autenticação)
# Endpoint: https://viacep.com.br/ws/{cep}/json/

# Correios (frete)
CORREIOS_USUARIO=
CORREIOS_SENHA=
CORREIOS_CODIGO_EMPRESA=

# Jadlog
JADLOG_TOKEN=
JADLOG_CONTA=

# Shopify Shipping (se usar Shopify)
SHOPIFY_STORE_URL=
SHOPIFY_ACCESS_TOKEN=
```

## Melhor Envio (recomendado)

Agrega Correios, JadLog, Loggi e outros. Gratuito para consultar fretes.

1. Acesse [melhorenvio.com.br](https://melhorenvio.com.br)
2. Crie conta de vendedor
3. **Tokens → Criar token** (selecionar escopos necessários)

```typescript
// lib/frete.ts
export async function calcularFrete(cepOrigem: string, cepDestino: string, peso: number) {
  const response = await fetch('https://melhorenvio.com.br/api/v2/me/shipment/calculate', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.MELHORENVIO_TOKEN}`,
      'Content-Type': 'application/json',
      'User-Agent': 'meuapp@email.com'
    },
    body: JSON.stringify({
      from: { postal_code: cepOrigem },
      to: { postal_code: cepDestino },
      package: { weight: peso, width: 20, height: 20, length: 20 }
    })
  })
  return response.json()
}
```

## ViaCEP (busca de endereço por CEP)

Gratuito, sem autenticação:

```typescript
export async function buscarEndereco(cep: string) {
  const cepLimpo = cep.replace(/\D/g, '')
  const response = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`)
  const data = await response.json()
  
  if (data.erro) throw new Error('CEP não encontrado')
  
  return {
    logradouro: data.logradouro,
    bairro: data.bairro,
    cidade: data.localidade,
    estado: data.uf,
    cep: data.cep
  }
}
```

## Rastreamento de encomendas

Para rastreamento dos Correios, use a biblioteca `correios-rastreio`:

```bash
npm install correios-rastreio
```

```typescript
import { rastrear } from 'correios-rastreio'

const eventos = await rastrear('BR123456789BR')
```
