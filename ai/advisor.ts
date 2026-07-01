/**
 * GPT Advisor — arquiteto técnico consultivo. Nunca executa alterações.
 * Regras completas: docs/GPT_ADVISOR_RULES.md
 *
 * A OPENAI_API_KEY é usada apenas no header Authorization da chamada HTTP;
 * nunca é incluída no prompt/input enviado ao modelo.
 */

import dotenv from 'dotenv';
dotenv.config({ path: '.credentials/ia/.env' });

import { montarPrompt } from './prompt.ts';

export interface AdvisorResponse {
  diagnostico: string;
  causaProvavel: string;
  nivelConfianca: number;
  proximaAcao: string;
  precisaDeploy: boolean;
  precisaNovoToken: boolean;
  precisaAcaoHumana: boolean;
  justificativa: string;
}

const RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    diagnostico: { type: 'string' },
    causaProvavel: { type: 'string' },
    nivelConfianca: { type: 'number' },
    proximaAcao: { type: 'string' },
    precisaDeploy: { type: 'boolean' },
    precisaNovoToken: { type: 'boolean' },
    precisaAcaoHumana: { type: 'boolean' },
    justificativa: { type: 'string' },
  },
  required: [
    'diagnostico',
    'causaProvavel',
    'nivelConfianca',
    'proximaAcao',
    'precisaDeploy',
    'precisaNovoToken',
    'precisaAcaoHumana',
    'justificativa',
  ],
  additionalProperties: false,
} as const;

function extrairTexto(data: any): string {
  if (typeof data.output_text === 'string' && data.output_text) return data.output_text;
  const mensagem = (data.output ?? []).find((o: any) => o.type === 'message');
  const bloco = mensagem?.content?.find((c: any) => c.type === 'output_text');
  return bloco?.text ?? '{}';
}

/**
 * Consulta o GPT Advisor. Retorna diagnóstico estruturado — nunca código, nunca executa nada.
 * Modelo configurável via OPENAI_MODEL (verificar disponibilidade atual na OpenAI antes de trocar).
 */
export async function consultarAdvisor(erro: string, log = ''): Promise<AdvisorResponse> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY não configurada em .credentials/ia/.env');
  }

  const input = montarPrompt(erro, log);

  const res = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || 'gpt-4.1-mini',
      input,
      text: {
        format: {
          type: 'json_schema',
          name: 'advisor_response',
          schema: RESPONSE_SCHEMA,
          strict: true,
        },
      },
    }),
  });

  if (!res.ok) {
    throw new Error(`OpenAI API ${res.status}: ${await res.text()}`);
  }

  const data = await res.json();
  return JSON.parse(extrairTexto(data)) as AdvisorResponse;
}
