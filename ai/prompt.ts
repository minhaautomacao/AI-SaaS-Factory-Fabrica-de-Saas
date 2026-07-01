/**
 * Monta o prompt enviado ao GPT Advisor.
 * Contexto mínimo por design: resumo curto do CURRENT_STATE.md + erro/log + pergunta objetiva.
 * Nunca envia o repositório inteiro nem arquivos de credenciais.
 */

import { readFileSync } from 'node:fs';
import { sanitize } from './sanitize.ts';

const RESUMO_MAX_CHARS = 1500;

function resumoEstadoAtual(caminho = 'docs/CURRENT_STATE.md'): string {
  try {
    return readFileSync(caminho, 'utf-8').slice(0, RESUMO_MAX_CHARS);
  } catch {
    return '(docs/CURRENT_STATE.md não encontrado)';
  }
}

export function montarPrompt(erro: string, log = ''): string {
  const estado = sanitize(resumoEstadoAtual());
  const erroSanitizado = sanitize(erro);
  const logSanitizado = log ? sanitize(log) : '';

  return [
    'Projeto:',
    'Enemeop Flores',
    '',
    'Estado (resumo de docs/CURRENT_STATE.md):',
    estado,
    '',
    'Erro reportado:',
    erroSanitizado,
    logSanitizado ? `\nLog:\n${logSanitizado}` : '',
    '',
    'Pergunta:',
    'Qual é a próxima ação técnica única recomendada? Baseie-se apenas em evidência objetiva — ' +
      'se faltar evidência suficiente, diga isso explicitamente em vez de supor.',
  ]
    .filter(Boolean)
    .join('\n');
}
