/**
 * lalamove.ts — Cotação de frete via Lalamove API v3
 *
 * Credenciais (workspace_credentials, tipo='logistica'):
 *   lalamove_key    — API Key
 *   lalamove_secret — API Secret (para assinatura HMAC-SHA256)
 *
 * Documentação: https://developers.lalamove.com/
 * Suporte BR: https://www.lalamove.com/brazil/sao-paulo/pt-BR/
 *
 * Endereço de coleta deve ser configurado via payload:
 *   endereco_origem — "Rua X, 123, Bairro, Cidade, Estado"
 *   lat_origem / lng_origem — coordenadas (alternativa ao endereço)
 */

import type { DadosFrete, OpcaoFrete } from './transportadoras.ts';

const BASE_URL = 'https://rest.lalamove.com';

async function gerarAssinatura(
  apiKey: string,
  apiSecret: string,
  method: string,
  path: string,
  body: string,
  timestamp: string,
): Promise<string> {
  const rawSignature = `${timestamp}\r\n${method}\r\n${path}\r\n\r\n${body}`;
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(apiSecret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(rawSignature));
  return Array.from(new Uint8Array(signature)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function calcularFreteLalamove(
  apiKey: string,
  apiSecret: string,
  dados: DadosFrete,
  opcoes?: {
    lat_origem?: string;
    lng_origem?: string;
    lat_destino?: string;
    lng_destino?: string;
    endereco_origem?: string;
    endereco_destino?: string;
  },
): Promise<OpcaoFrete[]> {
  const path = '/v3/quotations';
  const timestamp = String(Date.now());

  const bodyObj = {
    data: {
      serviceType: 'MOTORCYCLE',
      language: 'pt_BR',
      stops: [
        {
          coordinates: {
            lat: opcoes?.lat_origem ?? '-23.5505',
            lng: opcoes?.lng_origem ?? '-46.6333',
          },
          address: opcoes?.endereco_origem ?? 'São Paulo, SP',
        },
        {
          coordinates: {
            lat: opcoes?.lat_destino ?? '-23.5505',
            lng: opcoes?.lng_destino ?? '-46.6333',
          },
          address: opcoes?.endereco_destino ?? dados.cep_destino,
        },
      ],
      item: {
        quantity: '1',
        weight: 'LESS_THAN_3KG',
        categories: ['FLOWER'],
        handlingInstructions: ['FRAGILE'],
      },
    },
  };

  const bodyStr = JSON.stringify(bodyObj);
  const signature = await gerarAssinatura(apiKey, apiSecret, 'POST', path, bodyStr, timestamp);

  const resp = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `hmac ${apiKey}:${timestamp}:${signature}`,
      'Market': 'BR',
    },
    body: bodyStr,
  });

  if (!resp.ok) {
    const err = await resp.text().catch(() => resp.status.toString());
    throw new Error(`Lalamove HTTP ${resp.status}: ${err}`);
  }

  const data = await resp.json() as {
    data?: {
      priceBreakdown?: { total: string; currency: string };
      distance?: { value: string };
    };
  };

  const preco = parseFloat(data.data?.priceBreakdown?.total ?? '0');
  if (!preco) return [];

  return [{
    transportadora: 'Lalamove',
    servico: 'Moto',
    preco,
    prazo_dias: 0,
  }];
}
